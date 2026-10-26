using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

// Solo lectura: indicadores de confiabilidad y consumo de repuestos
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IndicadoresController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public IndicadoresController(CmmsDbContext context)
    {
        _context = context;
    }

    // Si se indican año y mes, devuelve el rango de ese mes; si no, todo el historial.
    private static (DateTime Desde, DateTime Hasta) RangoPeriodo(int? anio, int? mes)
    {
        if (anio is null || mes is null) return (DateTime.MinValue, DateTime.MaxValue);
        var desde = new DateTime(anio.Value, mes.Value, 1);
        return (desde, desde.AddMonths(1));
    }

    private static bool PeriodoInvalido(int? anio, int? mes) =>
        (mes is not null && (mes < 1 || mes > 12)) ||
        (anio is not null && (anio < 2000 || anio > 2100));

    // ===== Indicadores históricos (calculados por las vistas de SQL Server) =====

    [HttpGet("mtbf")]
    public async Task<ActionResult<IEnumerable<MtbfDto>>> GetMtbf()
    {
        var datos = await _context.VwMtbfs
            .Select(v => new MtbfDto { MaquinaId = v.MaquinaId, Nombre = v.Nombre, MtbfHoras = v.MtbfHoras })
            .ToListAsync();
        return Ok(datos);
    }

    [HttpGet("mtbf/{maquinaId}")]
    public async Task<ActionResult<MtbfDto>> GetMtbfPorMaquina(int maquinaId)
    {
        var dato = await _context.VwMtbfs.FirstOrDefaultAsync(v => v.MaquinaId == maquinaId);
        if (dato is null) return NotFound("No hay suficientes paros registrados para calcular el MTBF de esta máquina.");
        return Ok(new MtbfDto { MaquinaId = dato.MaquinaId, Nombre = dato.Nombre, MtbfHoras = dato.MtbfHoras });
    }

    [HttpGet("mttr")]
    public async Task<ActionResult<IEnumerable<MttrDto>>> GetMttr()
    {
        var datos = await _context.VwMttrs
            .Select(v => new MttrDto { MaquinaId = v.MaquinaId, Nombre = v.Nombre, MttrHoras = v.MttrHoras, TotalParos = v.TotalParos })
            .ToListAsync();
        return Ok(datos);
    }

    [HttpGet("mttr/{maquinaId}")]
    public async Task<ActionResult<MttrDto>> GetMttrPorMaquina(int maquinaId)
    {
        var dato = await _context.VwMttrs.FirstOrDefaultAsync(v => v.MaquinaId == maquinaId);
        if (dato is null) return NotFound("No hay paros cerrados registrados para calcular el MTTR de esta máquina.");
        return Ok(new MttrDto { MaquinaId = dato.MaquinaId, Nombre = dato.Nombre, MttrHoras = dato.MttrHoras, TotalParos = dato.TotalParos });
    }

    [HttpGet("consumo-repuestos")]
    public async Task<ActionResult<IEnumerable<ConsumoRepuestoResumenDto>>> GetConsumoRepuestos()
    {
        var datos = await _context.VwConsumoRepuestos
            .OrderByDescending(v => v.FechaConsumo)
            .Select(v => new ConsumoRepuestoResumenDto
            {
                ConsumoId = v.ConsumoId,
                OrdenId = v.OrdenId,
                RepuestoId = v.RepuestoId,
                NombreRepuesto = v.NombreRepuesto,
                Cantidad = v.Cantidad,
                CostoUnitario = v.CostoUnitario,
                CostoTotal = v.CostoTotal,
                FechaConsumo = v.FechaConsumo
            })
            .ToListAsync();
        return Ok(datos);
    }

    [HttpGet("consumo-repuestos/por-orden/{ordenId}")]
    public async Task<ActionResult<IEnumerable<ConsumoRepuestoResumenDto>>> GetConsumoRepuestosPorOrden(int ordenId)
    {
        var datos = await _context.VwConsumoRepuestos
            .Where(v => v.OrdenId == ordenId)
            .Select(v => new ConsumoRepuestoResumenDto
            {
                ConsumoId = v.ConsumoId,
                OrdenId = v.OrdenId,
                RepuestoId = v.RepuestoId,
                NombreRepuesto = v.NombreRepuesto,
                Cantidad = v.Cantidad,
                CostoUnitario = v.CostoUnitario,
                CostoTotal = v.CostoTotal,
                FechaConsumo = v.FechaConsumo
            })
            .ToListAsync();
        return Ok(datos);
    }

    // ===== Indicadores con filtro por mes (?anio=2026&mes=10). Sin parámetros = todo el historial =====

    // MTTR del periodo: promedio de duración de los paros cerrados que empezaron en el mes
    [HttpGet("mttr-periodo")]
    public async Task<ActionResult<IEnumerable<MttrDto>>> GetMttrPeriodo(int? anio, int? mes)
    {
        if (PeriodoInvalido(anio, mes)) return BadRequest("El periodo indicado no es válido.");
        var (desde, hasta) = RangoPeriodo(anio, mes);

        var paros = await _context.ParosMaquinas
            .Include(p => p.Maquina)
            .Where(p => p.FechaFin != null && p.FechaInicio >= desde && p.FechaInicio < hasta)
            .ToListAsync();

        var datos = paros
            .GroupBy(p => p.MaquinaId)
            .Select(g => new MttrDto
            {
                MaquinaId = g.Key,
                Nombre = g.First().Maquina.Nombre,
                MttrHoras = (decimal)g.Average(p => (p.DuracionMinutos ?? 0) / 60.0),
                TotalParos = g.Count()
            })
            .OrderBy(d => d.Nombre)
            .ToList();

        return Ok(datos);
    }

    // MTBF del periodo: promedio de horas entre paros consecutivos de la misma máquina.
    // Cada intervalo cuenta en el mes en que empieza el segundo paro (el que lo "cierra").
    [HttpGet("mtbf-periodo")]
    public async Task<ActionResult<IEnumerable<MtbfDto>>> GetMtbfPeriodo(int? anio, int? mes)
    {
        if (PeriodoInvalido(anio, mes)) return BadRequest("El periodo indicado no es válido.");
        var (desde, hasta) = RangoPeriodo(anio, mes);

        var paros = await _context.ParosMaquinas.Include(p => p.Maquina).ToListAsync();

        var resultado = new List<MtbfDto>();
        foreach (var grupo in paros.GroupBy(p => p.MaquinaId))
        {
            var lista = grupo.OrderBy(p => p.FechaInicio).ToList();
            var intervalos = new List<double>();

            for (var i = 1; i < lista.Count; i++)
            {
                var inicioSiguiente = lista[i].FechaInicio;
                if (inicioSiguiente >= desde && inicioSiguiente < hasta)
                    intervalos.Add((inicioSiguiente - lista[i - 1].FechaInicio).TotalHours);
            }

            if (intervalos.Count > 0)
            {
                resultado.Add(new MtbfDto
                {
                    MaquinaId = grupo.Key,
                    Nombre = lista[0].Maquina.Nombre,
                    MtbfHoras = (decimal)intervalos.Average()
                });
            }
        }

        return Ok(resultado.OrderBy(r => r.Nombre).ToList());
    }

    // Detalle de repuestos consumidos en el periodo, con la máquina, el área y el tipo de mantenimiento
    [HttpGet("consumo-detalle")]
    public async Task<ActionResult<IEnumerable<ConsumoDetalleDto>>> GetConsumoDetalle(int? anio, int? mes)
    {
        if (PeriodoInvalido(anio, mes)) return BadRequest("El periodo indicado no es válido.");
        var (desde, hasta) = RangoPeriodo(anio, mes);

        var datos = await _context.ConsumoRepuestos
            .Where(c => c.FechaConsumo >= desde && c.FechaConsumo < hasta)
            .OrderByDescending(c => c.FechaConsumo)
            .Select(c => new ConsumoDetalleDto
            {
                ConsumoId = c.ConsumoId,
                Fecha = c.FechaConsumo,
                OrdenId = c.OrdenId,
                Repuesto = c.Repuesto.Nombre,
                Categoria = c.Repuesto.Categoria.NombreCategoria,
                UnidadMedida = c.Repuesto.UnidadMedida,
                Cantidad = c.Cantidad,
                CostoUnitario = c.Repuesto.CostoUnitario,
                CostoTotal = c.Cantidad * c.Repuesto.CostoUnitario,
                Maquina = c.Orden.Maquina.Nombre,
                Area = c.Orden.Maquina.Area.NombreArea,
                TipoMantenimiento = c.Orden.TipoMantenimiento.Nombre
            })
            .ToListAsync();

        return Ok(datos);
    }

    // Tendencia mes a mes en un rango (?desde=2026-10&hasta=2026-12).
    // MTTR y MTBF son promedios de todas las máquinas juntas en cada mes.
    [HttpGet("tendencia")]
    public async Task<ActionResult<IEnumerable<TendenciaMesDto>>> GetTendencia(string desde, string hasta)
    {
        if (!DateTime.TryParseExact(desde, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var inicio) ||
            !DateTime.TryParseExact(hasta, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fin))
            return BadRequest("Los meses deben tener el formato aaaa-mm (por ejemplo 2026-10).");
        if (fin < inicio)
            return BadRequest("El mes final no puede ser anterior al inicial.");
        if ((fin.Year - inicio.Year) * 12 + fin.Month - inicio.Month + 1 > 24)
            return BadRequest("El rango máximo es de 24 meses.");

        var limite = fin.AddMonths(1); // fin exclusivo

        // Paros hasta el final del rango (el MTBF necesita el paro anterior de cada máquina)
        var paros = await _context.ParosMaquinas.Where(p => p.FechaInicio < limite).ToListAsync();

        var intervalos = new List<(DateTime Fin, double Horas)>();
        foreach (var grupo in paros.GroupBy(p => p.MaquinaId))
        {
            var lista = grupo.OrderBy(p => p.FechaInicio).ToList();
            for (var i = 1; i < lista.Count; i++)
                intervalos.Add((lista[i].FechaInicio, (lista[i].FechaInicio - lista[i - 1].FechaInicio).TotalHours));
        }

        var consumos = await _context.ConsumoRepuestos
            .Where(c => c.FechaConsumo >= inicio && c.FechaConsumo < limite)
            .Select(c => new
            {
                c.FechaConsumo,
                Total = c.Cantidad * c.Repuesto.CostoUnitario,
                Tipo = c.Orden.TipoMantenimiento.Nombre
            })
            .ToListAsync();

        var resultado = new List<TendenciaMesDto>();
        for (var mesInicio = inicio; mesInicio <= fin; mesInicio = mesInicio.AddMonths(1))
        {
            var mesSiguiente = mesInicio.AddMonths(1);

            var parosMes = paros.Where(p => p.FechaInicio >= mesInicio && p.FechaInicio < mesSiguiente).ToList();
            var cerrados = parosMes.Where(p => p.FechaFin != null).ToList();
            var intervalosMes = intervalos.Where(x => x.Fin >= mesInicio && x.Fin < mesSiguiente).ToList();
            var consumosMes = consumos.Where(c => c.FechaConsumo >= mesInicio && c.FechaConsumo < mesSiguiente).ToList();

            resultado.Add(new TendenciaMesDto
            {
                Anio = mesInicio.Year,
                Mes = mesInicio.Month,
                TotalParos = parosMes.Count,
                MttrHoras = cerrados.Count > 0 ? (decimal)cerrados.Average(p => (p.DuracionMinutos ?? 0) / 60.0) : null,
                MtbfHoras = intervalosMes.Count > 0 ? (decimal)intervalosMes.Average(x => x.Horas) : null,
                InversionPreventivo = consumosMes.Where(c => c.Tipo == "Preventivo").Sum(c => c.Total),
                ConsumoTotal = consumosMes.Sum(c => c.Total)
            });
        }

        return Ok(resultado);
    }
}