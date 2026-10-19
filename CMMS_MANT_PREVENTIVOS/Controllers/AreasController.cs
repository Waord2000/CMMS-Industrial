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
public class AreasController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public AreasController(CmmsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AreaDto>>> GetAll()
    {
        var areas = await _context.Areas
            .Select(a => new AreaDto { AreaId = a.AreaId, NombreArea = a.NombreArea })
            .ToListAsync();
        return Ok(areas);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AreaDto>> GetById(int id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area is null) return NotFound();
        return Ok(new AreaDto { AreaId = area.AreaId, NombreArea = area.NombreArea });
    }

    [HttpPost]
    public async Task<ActionResult<AreaDto>> Create(AreaCreateDto dto)
    {
        var area = new Area { NombreArea = dto.NombreArea };
        _context.Areas.Add(area);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = area.AreaId },
            new AreaDto { AreaId = area.AreaId, NombreArea = area.NombreArea });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, AreaCreateDto dto)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area is null) return NotFound();
        area.NombreArea = dto.NombreArea;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area is null) return NotFound();

        try
        {
            _context.Areas.Remove(area);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se puede eliminar: hay máquinas asignadas a esta área.");
        }
    }
}