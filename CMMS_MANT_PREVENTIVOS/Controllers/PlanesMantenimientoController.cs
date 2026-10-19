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
public class PlanesMantenimientoController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public PlanesMantenimientoController(CmmsDbContext context)
    {
        _context = context;
    }

    private static PlanMantenimientoDto ToDto(PlanesMantenimiento p) => new()
    {
        PlanId = p.PlanId,
        MaquinaId = p.MaquinaId,
        NombreMaquina = p.Maquina.Nombre,
        NombrePlan = p.NombrePlan,
        FrecuenciaMeses = p.FrecuenciaMeses,
        UltimaEjecucion = p.UltimaEjecucion,
        ProximaEjecucion = p.ProximaEjecucion,
        Activo = p.Activo
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlanMantenimientoDto>>> GetAll()
    {
        var planes = await _context.PlanesMantenimientos
            .Include(p => p.Maquina)
            .Select(p => ToDto(p))
            .ToListAsync();
        return Ok(planes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlanMantenimientoDto>> GetById(int id)
    {
        var plan = await _context.PlanesMantenimientos.Include(p => p.Maquina)
            .FirstOrDefaultAsync(p => p.PlanId == id);
        if (plan is null) return NotFound();
        return Ok(ToDto(plan));
    }

    [HttpPost]
    public async Task<ActionResult<PlanMantenimientoDto>> Create(PlanMantenimientoCreateDto dto)
    {
        if (dto.FrecuenciaMeses < 1 || dto.FrecuenciaMeses > 12)
            return BadRequest("FrecuenciaMeses debe estar entre 1 y 12.");

        var maquinaExiste = await _context.Maquinas.AnyAsync(m => m.MaquinaId == dto.MaquinaId);
        if (!maquinaExiste) return BadRequest("El MaquinaId indicado no existe.");

        var plan = new PlanesMantenimiento
        {
            MaquinaId = dto.MaquinaId,
            NombrePlan = dto.NombrePlan,
            FrecuenciaMeses = dto.FrecuenciaMeses,
            UltimaEjecucion = dto.UltimaEjecucion,
            Activo = dto.Activo,
            ProximaEjecucion = dto.ProximaEjecucion ?? dto.UltimaEjecucion?.AddMonths(dto.FrecuenciaMeses)
        };

        _context.PlanesMantenimientos.Add(plan);
        await _context.SaveChangesAsync();
        await _context.Entry(plan).Reference(p => p.Maquina).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = plan.PlanId }, ToDto(plan));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PlanMantenimientoCreateDto dto)
    {
        if (dto.FrecuenciaMeses < 1 || dto.FrecuenciaMeses > 12)
            return BadRequest("FrecuenciaMeses debe estar entre 1 y 12.");

        var plan = await _context.PlanesMantenimientos.FindAsync(id);
        if (plan is null) return NotFound();

        var maquinaExiste = await _context.Maquinas.AnyAsync(m => m.MaquinaId == dto.MaquinaId);
        if (!maquinaExiste) return BadRequest("El MaquinaId indicado no existe.");

        plan.MaquinaId = dto.MaquinaId;
        plan.NombrePlan = dto.NombrePlan;
        plan.FrecuenciaMeses = dto.FrecuenciaMeses;
        plan.UltimaEjecucion = dto.UltimaEjecucion;
        plan.Activo = dto.Activo;
        plan.ProximaEjecucion = dto.ProximaEjecucion ?? dto.UltimaEjecucion?.AddMonths(dto.FrecuenciaMeses);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await _context.PlanesMantenimientos.FindAsync(id);
        if (plan is null) return NotFound();
        _context.PlanesMantenimientos.Remove(plan);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}