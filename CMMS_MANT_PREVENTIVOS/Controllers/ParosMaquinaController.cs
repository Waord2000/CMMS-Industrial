using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.Data.Models;
using CMMS_MANT_PREVENTIVOS.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ParosMaquinaController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public ParosMaquinaController(CmmsDbContext context)
    {
        _context = context;
    }

    private static ParoMaquinaDto ToDto(ParosMaquina p) => new()
    {
        ParoId = p.ParoId,
        MaquinaId = p.MaquinaId,
        NombreMaquina = p.Maquina.Nombre,
        OrdenId = p.OrdenId,
        FechaInicio = p.FechaInicio,
        FechaFin = p.FechaFin,
        DuracionMinutos = p.DuracionMinutos,
        Causa = p.Causa
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ParoMaquinaDto>>> GetAll()
    {
        var paros = await _context.ParosMaquinas.Include(p => p.Maquina)
            .OrderByDescending(p => p.FechaInicio)
            .Select(p => ToDto(p)).ToListAsync();
        return Ok(paros);
    }

    // Paros que aún no se han cerrado (la máquina sigue detenida)
    [HttpGet("activos")]
    public async Task<ActionResult<IEnumerable<ParoMaquinaDto>>> GetActivos()
    {
        var paros = await _context.ParosMaquinas.Include(p => p.Maquina)
            .Where(p => p.FechaFin == null)
            .Select(p => ToDto(p)).ToListAsync();
        return Ok(paros);
    }

    [HttpGet("por-maquina/{maquinaId}")]
    public async Task<ActionResult<IEnumerable<ParoMaquinaDto>>> GetByMaquina(int maquinaId)
    {
        var paros = await _context.ParosMaquinas.Include(p => p.Maquina)
            .Where(p => p.MaquinaId == maquinaId)
            .OrderByDescending(p => p.FechaInicio)
            .Select(p => ToDto(p)).ToListAsync();
        return Ok(paros);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ParoMaquinaDto>> GetById(int id)
    {
        var p = await _context.ParosMaquinas.Include(x => x.Maquina).FirstOrDefaultAsync(x => x.ParoId == id);
        if (p is null) return NotFound();
        return Ok(ToDto(p));
    }

    // Registra el inicio de un paro (la máquina acaba de fallar)
    [HttpPost]
    public async Task<ActionResult<ParoMaquinaDto>> Create(ParoMaquinaCreateDto dto)
    {
        if (!await _context.Maquinas.AnyAsync(m => m.MaquinaId == dto.MaquinaId))
            return BadRequest("El MaquinaId indicado no existe.");
        if (dto.OrdenId.HasValue && !await _context.OrdenesTrabajos.AnyAsync(o => o.OrdenId == dto.OrdenId))
            return BadRequest("El OrdenId indicado no existe.");
        if (dto.FechaInicio.HasValue && dto.FechaInicio.Value > DateTime.Now)
            return BadRequest("La hora de inicio no puede ser futura.");

        var yaTieneParoActivo = await _context.ParosMaquinas
            .AnyAsync(p => p.MaquinaId == dto.MaquinaId && p.FechaFin == null);
        if (yaTieneParoActivo)
            return BadRequest("Esta máquina ya tiene un paro activo sin cerrar.");

        var paro = new ParosMaquina
        {
            MaquinaId = dto.MaquinaId,
            OrdenId = dto.OrdenId,
            FechaInicio = dto.FechaInicio ?? DateTime.Now,
            Causa = dto.Causa
        };

        _context.ParosMaquinas.Add(paro);
        await _context.SaveChangesAsync();

        var creado = await _context.ParosMaquinas.Include(p => p.Maquina).FirstAsync(p => p.ParoId == paro.ParoId);
        return CreatedAtAction(nameof(GetById), new { id = paro.ParoId }, ToDto(creado));
    }

    // Cierra el paro (la máquina ya fue reparada) y calcula la duración
    [HttpPut("{id}/cerrar")]
    public async Task<ActionResult<ParoMaquinaDto>> Cerrar(int id, ParoMaquinaCerrarDto? dto)
    {
        var paro = await _context.ParosMaquinas.FindAsync(id);
        if (paro is null) return NotFound();
        if (paro.FechaFin is not null)
            return BadRequest("Este paro ya fue cerrado.");

        var fechaFin = dto?.FechaFin ?? DateTime.Now;
        if (fechaFin < paro.FechaInicio)
            return BadRequest("La hora de finalización no puede ser anterior a la hora de inicio.");

        paro.FechaFin = fechaFin;
        if (dto?.Causa is not null) paro.Causa = dto.Causa;

        await _context.SaveChangesAsync();

        var actualizado = await _context.ParosMaquinas.Include(p => p.Maquina).FirstAsync(p => p.ParoId == id);
        return Ok(ToDto(actualizado));
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var paro = await _context.ParosMaquinas.FindAsync(id);
        if (paro is null) return NotFound();
        _context.ParosMaquinas.Remove(paro);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}