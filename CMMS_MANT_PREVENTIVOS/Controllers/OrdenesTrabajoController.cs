using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.Data.Models;
using CMMS_MANT_PREVENTIVOS.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdenesTrabajoController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public OrdenesTrabajoController(CmmsDbContext context)
    {
        _context = context;
    }

    private static OrdenTrabajoDto ToDto(OrdenesTrabajo o) => new()
    {
        OrdenId = o.OrdenId,
        MaquinaId = o.MaquinaId,
        NombreMaquina = o.Maquina.Nombre,
        PlanId = o.PlanId,
        NombrePlan = o.Plan?.NombrePlan,
        TipoMantenimientoId = o.TipoMantenimientoId,
        NombreTipoMantenimiento = o.TipoMantenimiento.Nombre,
        UsuarioAsignadoId = o.UsuarioAsignadoId,
        NombreUsuarioAsignado = o.UsuarioAsignado?.NombreCompleto,
        FechaCreacion = o.FechaCreacion,
        FechaProgramada = o.FechaProgramada,
        HoraInicio = o.HoraInicio,
        HoraFin = o.HoraFin,
        DuracionMinutos = o.DuracionMinutos,
        Estado = o.Estado,
        Descripcion = o.Descripcion,
        Observaciones = o.Observaciones
    };

    private IQueryable<OrdenesTrabajo> QueryConIncludes() =>
        _context.OrdenesTrabajos
            .Include(o => o.Maquina)
            .Include(o => o.Plan)
            .Include(o => o.TipoMantenimiento)
            .Include(o => o.UsuarioAsignado);

    // Evita duplicados de un mismo plan:
    // 1) un plan no puede tener dos órdenes abiertas (Pendiente / En Proceso) a la vez;
    // 2) una vez realizado el mantenimiento, no se puede registrar otro hasta el primer día
    //    del mes de su próxima ejecución (que se calcula con la frecuencia del plan).
    // Devuelve el mensaje de error, o null si todo está bien.
    private async Task<string?> ValidarDuplicidadPlanAsync(int planId, DateOnly fecha, int ordenIgnorarId = 0)
    {
        var plan = await _context.PlanesMantenimientos.FindAsync(planId);
        if (plan is null) return "El PlanId indicado no existe.";

        var hayOrdenAbierta = await _context.OrdenesTrabajos.AnyAsync(o =>
            o.PlanId == planId
            && (o.Estado == "Pendiente" || o.Estado == "En Proceso")
            && o.OrdenId != ordenIgnorarId);
        if (hayOrdenAbierta)
            return "Este plan ya tiene una orden pendiente o en proceso. Completa esa orden en lugar de crear otra.";

        if (plan.ProximaEjecucion.HasValue)
        {
            var prox = plan.ProximaEjecucion.Value;
            var inicioVentana = new DateOnly(prox.Year, prox.Month, 1);
            if (fecha < inicioVentana)
            {
                var ultima = plan.UltimaEjecucion.HasValue
                    ? $" El último se realizó el {plan.UltimaEjecucion.Value:dd/MM/yyyy}."
                    : "";
                return $"Este mantenimiento ya se realizó para el periodo actual.{ultima} La próxima ejecución corresponde a partir de {inicioVentana:MM/yyyy}.";
            }
        }

        return null;
    }

    // Cualquier usuario autenticado puede ver el listado (el Técnico lo necesita
    // para ubicar sus propias órdenes).
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrdenTrabajoDto>>> GetAll()
    {
        var ordenes = await QueryConIncludes().Select(o => ToDto(o)).ToListAsync();
        return Ok(ordenes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrdenTrabajoDto>> GetById(int id)
    {
        var orden = await QueryConIncludes().FirstOrDefaultAsync(o => o.OrdenId == id);
        if (orden is null) return NotFound();
        return Ok(ToDto(orden));
    }

    [Authorize(Roles = "Administrador,Supervisor")]
    [HttpPost]
    public async Task<ActionResult<OrdenTrabajoDto>> Create(OrdenTrabajoCreateDto dto)
    {
        if (!await _context.Maquinas.AnyAsync(m => m.MaquinaId == dto.MaquinaId))
            return BadRequest("El MaquinaId indicado no existe.");
        if (!await _context.TiposMantenimientos.AnyAsync(t => t.TipoMantenimientoId == dto.TipoMantenimientoId))
            return BadRequest("El TipoMantenimientoId indicado no existe.");
        if (dto.PlanId.HasValue && !await _context.PlanesMantenimientos.AnyAsync(p => p.PlanId == dto.PlanId))
            return BadRequest("El PlanId indicado no existe.");
        if (dto.UsuarioAsignadoId.HasValue && !await _context.Usuarios.AnyAsync(u => u.UsuarioId == dto.UsuarioAsignadoId))
            return BadRequest("El UsuarioAsignadoId indicado no existe.");

        if (dto.PlanId.HasValue)
        {
            var errorDup = await ValidarDuplicidadPlanAsync(dto.PlanId.Value, dto.FechaProgramada ?? DateOnly.FromDateTime(DateTime.Now));
            if (errorDup is not null) return BadRequest(errorDup);
        }

        var orden = new OrdenesTrabajo
        {
            MaquinaId = dto.MaquinaId,
            PlanId = dto.PlanId,
            TipoMantenimientoId = dto.TipoMantenimientoId,
            UsuarioAsignadoId = dto.UsuarioAsignadoId,
            FechaCreacion = DateTime.Now,
            FechaProgramada = dto.FechaProgramada,
            Estado = "Pendiente",
            Descripcion = dto.Descripcion,
            Observaciones = dto.Observaciones
        };

        _context.OrdenesTrabajos.Add(orden);
        await _context.SaveChangesAsync();

        var creada = await QueryConIncludes().FirstAsync(o => o.OrdenId == orden.OrdenId);
        return CreatedAtAction(nameof(GetById), new { id = orden.OrdenId }, ToDto(creada));
    }

    // El propio Técnico documenta un mantenimiento ya realizado: se crea directamente
    // como "Completada", con horas reales y descripción. Siempre queda asignada
    // a quien la crea (nunca a nombre de otro usuario, por seguridad).
    // Si RegistrarParo es true, se crea también el paro de la máquina con el mismo horario.
    [HttpPost("registrar")]
    public async Task<ActionResult<OrdenTrabajoDto>> RegistrarMantenimiento(RegistrarMantenimientoDto dto)
    {
        if (!await _context.Maquinas.AnyAsync(m => m.MaquinaId == dto.MaquinaId))
            return BadRequest("El MaquinaId indicado no existe.");
        if (!await _context.TiposMantenimientos.AnyAsync(t => t.TipoMantenimientoId == dto.TipoMantenimientoId))
            return BadRequest("El TipoMantenimientoId indicado no existe.");
        if (dto.PlanId.HasValue && !await _context.PlanesMantenimientos.AnyAsync(p => p.PlanId == dto.PlanId))
            return BadRequest("El PlanId indicado no existe.");
        if (dto.HoraFin <= dto.HoraInicio)
            return BadRequest("La hora de finalización debe ser posterior a la hora de inicio.");
        if (dto.Descripcion.Length > 300)
            return BadRequest("La descripción no puede superar los 300 caracteres.");
        if ((dto.Observaciones ?? string.Empty).Length > 500)
            return BadRequest("Las observaciones no pueden superar los 500 caracteres.");

        var miId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var fechaProgramada = dto.FechaProgramada ?? DateOnly.FromDateTime(DateTime.Now);

        if (fechaProgramada > DateOnly.FromDateTime(DateTime.Now))
            return BadRequest("La fecha de un mantenimiento realizado no puede ser futura.");

        if (dto.PlanId.HasValue)
        {
            var errorDup = await ValidarDuplicidadPlanAsync(dto.PlanId.Value, fechaProgramada);
            if (errorDup is not null) return BadRequest(errorDup);
        }

        var orden = new OrdenesTrabajo
        {
            MaquinaId = dto.MaquinaId,
            PlanId = dto.PlanId,
            TipoMantenimientoId = dto.TipoMantenimientoId,
            UsuarioAsignadoId = miId,
            FechaCreacion = DateTime.Now,
            FechaProgramada = fechaProgramada,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            Estado = "Completada",
            Descripcion = dto.Descripcion,
            Observaciones = dto.Observaciones
        };

        _context.OrdenesTrabajos.Add(orden);

        if (dto.RegistrarParo)
        {
            var causa = $"Mantenimiento: {dto.Descripcion}";
            if (causa.Length > 300) causa = causa[..300];

            _context.ParosMaquinas.Add(new ParosMaquina
            {
                MaquinaId = dto.MaquinaId,
                Orden = orden,
                FechaInicio = fechaProgramada.ToDateTime(dto.HoraInicio),
                FechaFin = fechaProgramada.ToDateTime(dto.HoraFin),
                Causa = causa
            });
        }

        if (dto.PlanId.HasValue)
        {
            var plan = await _context.PlanesMantenimientos.FindAsync(dto.PlanId.Value);
            if (plan is not null)
            {
                plan.UltimaEjecucion = fechaProgramada;
                plan.ProximaEjecucion = fechaProgramada.AddMonths(plan.FrecuenciaMeses);
            }
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se pudo guardar el mantenimiento. Revisa los datos e intenta de nuevo.");
        }

        var creada = await QueryConIncludes().FirstAsync(o => o.OrdenId == orden.OrdenId);
        return CreatedAtAction(nameof(GetById), new { id = orden.OrdenId }, ToDto(creada));
    }

    // Cambia la orden a "En Proceso". Admin/Supervisor pueden iniciar cualquier orden;
    // un Técnico solo puede iniciar la orden si es él quien está asignado.
    [HttpPut("{id}/iniciar")]
    public async Task<ActionResult<OrdenTrabajoDto>> Iniciar(int id)
    {
        var orden = await _context.OrdenesTrabajos.FindAsync(id);
        if (orden is null) return NotFound();
        if (orden.Estado != "Pendiente")
            return BadRequest($"Solo se puede iniciar una orden en estado 'Pendiente'. Estado actual: {orden.Estado}");

        if (User.IsInRole("Técnico"))
        {
            var miId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (orden.UsuarioAsignadoId != miId)
                return Forbid();
        }

        orden.Estado = "En Proceso";
        orden.HoraInicio = TimeOnly.FromDateTime(DateTime.Now);
        await _context.SaveChangesAsync();

        var actualizada = await QueryConIncludes().FirstAsync(o => o.OrdenId == id);
        return Ok(ToDto(actualizada));
    }

    // Cambia la orden a "Completada", registra hora de fin, genera el paro de la máquina
    // con ese horario, y si viene de un plan preventivo actualiza automáticamente
    // UltimaEjecucion / ProximaEjecucion del plan.
    // Misma regla: un Técnico solo completa SU propia orden asignada.
    [HttpPut("{id}/completar")]
    public async Task<ActionResult<OrdenTrabajoDto>> Completar(int id, OrdenTrabajoObservacionesDto? dto)
    {
        var orden = await _context.OrdenesTrabajos.Include(o => o.Plan).FirstOrDefaultAsync(o => o.OrdenId == id);
        if (orden is null) return NotFound();
        if (orden.Estado != "En Proceso")
            return BadRequest($"Solo se puede completar una orden en estado 'En Proceso'. Estado actual: {orden.Estado}");

        if (User.IsInRole("Técnico"))
        {
            var miId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (orden.UsuarioAsignadoId != miId)
                return Forbid();
        }

        var horaFin = TimeOnly.FromDateTime(DateTime.Now);
        if (orden.HoraInicio.HasValue && horaFin <= orden.HoraInicio.Value)
            return BadRequest("La hora de finalización debe ser posterior a la de inicio. Si el mantenimiento cruzó la medianoche o se inició otro día, usa 'Registrar mantenimiento realizado' con las horas reales.");

        orden.Estado = "Completada";
        orden.HoraFin = horaFin;
        if (dto?.Observaciones is not null) orden.Observaciones = dto.Observaciones;

        if (orden.HoraInicio.HasValue && !await _context.ParosMaquinas.AnyAsync(p => p.OrdenId == id))
        {
            var hoyFecha = DateOnly.FromDateTime(DateTime.Now);
            var causa = string.IsNullOrWhiteSpace(orden.Descripcion)
                ? $"Mantenimiento (orden #{orden.OrdenId})"
                : $"Mantenimiento: {orden.Descripcion}";
            if (causa.Length > 300) causa = causa[..300];

            _context.ParosMaquinas.Add(new ParosMaquina
            {
                MaquinaId = orden.MaquinaId,
                OrdenId = orden.OrdenId,
                FechaInicio = hoyFecha.ToDateTime(orden.HoraInicio.Value),
                FechaFin = hoyFecha.ToDateTime(horaFin),
                Causa = causa
            });
        }

        if (orden.Plan is not null)
        {
            var hoy = DateOnly.FromDateTime(DateTime.Now);
            orden.Plan.UltimaEjecucion = hoy;
            orden.Plan.ProximaEjecucion = hoy.AddMonths(orden.Plan.FrecuenciaMeses);
        }

        await _context.SaveChangesAsync();

        var actualizada = await QueryConIncludes().FirstAsync(o => o.OrdenId == id);
        return Ok(ToDto(actualizada));
    }

    [Authorize(Roles = "Administrador,Supervisor")]
    [HttpPut("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(int id, OrdenTrabajoObservacionesDto? dto)
    {
        var orden = await _context.OrdenesTrabajos.FindAsync(id);
        if (orden is null) return NotFound();
        if (orden.Estado == "Completada")
            return BadRequest("No se puede cancelar una orden ya completada.");

        orden.Estado = "Cancelada";
        if (dto?.Observaciones is not null) orden.Observaciones = dto.Observaciones;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Al eliminar una orden:
    //  - se eliminan los paros de máquina generados por ella,
    //  - los repuestos consumidos (insumos) VUELVEN al stock, dejando una "Entrada" de reversión
    //    en MovimientosInventario por cada insumo,
    //  - el historial de movimientos se conserva, pero desvinculado de la orden eliminada
    //    (el número de orden queda anotado en las observaciones).
    // Todo ocurre en una sola transacción: si algo falla, no se cambia nada.
    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var orden = await _context.OrdenesTrabajos.FindAsync(id);
        if (orden is null) return NotFound();

        using var transaccion = await _context.Database.BeginTransactionAsync();

        var paros = await _context.ParosMaquinas.Where(p => p.OrdenId == id).ToListAsync();
        _context.ParosMaquinas.RemoveRange(paros);

        // 1) Devolver al stock lo consumido por la orden.
        var consumos = await _context.ConsumoRepuestos.Where(c => c.OrdenId == id).ToListAsync();
        foreach (var consumo in consumos)
        {
            var repuesto = await _context.Repuestos.FindAsync(consumo.RepuestoId);
            if (repuesto is not null) repuesto.StockActual += consumo.Cantidad;

            _context.MovimientosInventarios.Add(new MovimientosInventario
            {
                RepuestoId = consumo.RepuestoId,
                TipoMovimiento = "Entrada",
                Cantidad = consumo.Cantidad,
                Fecha = DateTime.Now,
                OrdenId = null,
                Observaciones = $"Reversion por eliminacion de la orden #{id}"
            });
        }
        _context.ConsumoRepuestos.RemoveRange(consumos);

        // 2) Conservar el historial de movimientos, pero sin apuntar a una orden que ya no existe.
        var movimientos = await _context.MovimientosInventarios.Where(m => m.OrdenId == id).ToListAsync();
        foreach (var mov in movimientos)
        {
            var nota = $"(Orden #{id} eliminada) {mov.Observaciones}";
            mov.Observaciones = nota.Length > 300 ? nota[..300] : nota;
            mov.OrdenId = null;
        }

        _context.OrdenesTrabajos.Remove(orden);

        try
        {
            await _context.SaveChangesAsync();
            await transaccion.CommitAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se puede eliminar la orden porque tiene registros relacionados que la referencian.");
        }
    }

    // Permite corregir los datos de una orden ANTES de que inicie (mientras está "Pendiente").
    // Una vez en proceso o completada, ya no se edita el contenido — solo se usan
    // los endpoints de estado (iniciar/completar/cancelar) para no perder trazabilidad.
    [Authorize(Roles = "Administrador,Supervisor")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, OrdenTrabajoCreateDto dto)
    {
        var orden = await _context.OrdenesTrabajos.FindAsync(id);
        if (orden is null) return NotFound();

        if (orden.Estado != "Pendiente")
            return BadRequest($"Solo se puede editar una orden en estado 'Pendiente'. Estado actual: {orden.Estado}");

        if (!await _context.Maquinas.AnyAsync(m => m.MaquinaId == dto.MaquinaId))
            return BadRequest("El MaquinaId indicado no existe.");
        if (!await _context.TiposMantenimientos.AnyAsync(t => t.TipoMantenimientoId == dto.TipoMantenimientoId))
            return BadRequest("El TipoMantenimientoId indicado no existe.");
        if (dto.PlanId.HasValue && !await _context.PlanesMantenimientos.AnyAsync(p => p.PlanId == dto.PlanId))
            return BadRequest("El PlanId indicado no existe.");
        if (dto.UsuarioAsignadoId.HasValue && !await _context.Usuarios.AnyAsync(u => u.UsuarioId == dto.UsuarioAsignadoId))
            return BadRequest("El UsuarioAsignadoId indicado no existe.");

        if (dto.PlanId.HasValue)
        {
            var errorDup = await ValidarDuplicidadPlanAsync(dto.PlanId.Value, dto.FechaProgramada ?? DateOnly.FromDateTime(DateTime.Now), id);
            if (errorDup is not null) return BadRequest(errorDup);
        }

        orden.MaquinaId = dto.MaquinaId;
        orden.PlanId = dto.PlanId;
        orden.TipoMantenimientoId = dto.TipoMantenimientoId;
        orden.UsuarioAsignadoId = dto.UsuarioAsignadoId;
        orden.FechaProgramada = dto.FechaProgramada;
        orden.Descripcion = dto.Descripcion;
        orden.Observaciones = dto.Observaciones;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}