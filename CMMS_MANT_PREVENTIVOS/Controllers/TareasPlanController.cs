using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.Data.Models;
using CMMS_MANT_PREVENTIVOS.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

[Authorize]
[ApiController]
[Route("api/planesmantenimiento/{planId}/tareas")]
public class TareasPlanController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public TareasPlanController(CmmsDbContext context)
    {
        _context = context;
    }

    private static TareaPlanDto ToDto(TareasPlan t) => new()
    {
        TareaId = t.TareaId,
        PlanId = t.PlanId,
        Descripcion = t.Descripcion,
        TiempoEstimadoMin = t.TiempoEstimadoMin
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TareaPlanDto>>> GetAll(int planId)
    {
        var planExiste = await _context.PlanesMantenimientos.AnyAsync(p => p.PlanId == planId);
        if (!planExiste) return NotFound("El plan indicado no existe.");

        var tareas = await _context.TareasPlans
            .Where(t => t.PlanId == planId)
            .Select(t => ToDto(t))
            .ToListAsync();
        return Ok(tareas);
    }

    [HttpGet("{tareaId}")]
    public async Task<ActionResult<TareaPlanDto>> GetById(int planId, int tareaId)
    {
        var tarea = await _context.TareasPlans
            .FirstOrDefaultAsync(t => t.PlanId == planId && t.TareaId == tareaId);
        if (tarea is null) return NotFound();
        return Ok(ToDto(tarea));
    }

    [HttpPost]
    public async Task<ActionResult<TareaPlanDto>> Create(int planId, TareaPlanCreateDto dto)
    {
        var planExiste = await _context.PlanesMantenimientos.AnyAsync(p => p.PlanId == planId);
        if (!planExiste) return BadRequest("El plan indicado no existe.");

        var tarea = new TareasPlan
        {
            PlanId = planId,
            Descripcion = dto.Descripcion,
            TiempoEstimadoMin = dto.TiempoEstimadoMin
        };
        _context.TareasPlans.Add(tarea);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { planId, tareaId = tarea.TareaId }, ToDto(tarea));
    }

    [HttpPut("{tareaId}")]
    public async Task<IActionResult> Update(int planId, int tareaId, TareaPlanCreateDto dto)
    {
        var tarea = await _context.TareasPlans
            .FirstOrDefaultAsync(t => t.PlanId == planId && t.TareaId == tareaId);
        if (tarea is null) return NotFound();

        tarea.Descripcion = dto.Descripcion;
        tarea.TiempoEstimadoMin = dto.TiempoEstimadoMin;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{tareaId}")]
    public async Task<IActionResult> Delete(int planId, int tareaId)
    {
        var tarea = await _context.TareasPlans
            .FirstOrDefaultAsync(t => t.PlanId == planId && t.TareaId == tareaId);
        if (tarea is null) return NotFound();

        _context.TareasPlans.Remove(tarea);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
