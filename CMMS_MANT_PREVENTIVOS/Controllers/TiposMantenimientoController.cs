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
public class TiposMantenimientoController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public TiposMantenimientoController(CmmsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TipoMantenimientoDto>>> GetAll()
    {
        var tipos = await _context.TiposMantenimientos
            .Select(t => new TipoMantenimientoDto { TipoMantenimientoId = t.TipoMantenimientoId, Nombre = t.Nombre })
            .ToListAsync();
        return Ok(tipos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TipoMantenimientoDto>> GetById(int id)
    {
        var tipo = await _context.TiposMantenimientos.FindAsync(id);
        if (tipo is null) return NotFound();
        return Ok(new TipoMantenimientoDto { TipoMantenimientoId = tipo.TipoMantenimientoId, Nombre = tipo.Nombre });
    }

    [HttpPost]
    public async Task<ActionResult<TipoMantenimientoDto>> Create(TipoMantenimientoCreateDto dto)
    {
        var tipo = new TiposMantenimiento { Nombre = dto.Nombre };
        _context.TiposMantenimientos.Add(tipo);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = tipo.TipoMantenimientoId },
            new TipoMantenimientoDto { TipoMantenimientoId = tipo.TipoMantenimientoId, Nombre = tipo.Nombre });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TipoMantenimientoCreateDto dto)
    {
        var tipo = await _context.TiposMantenimientos.FindAsync(id);
        if (tipo is null) return NotFound();
        tipo.Nombre = dto.Nombre;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tipo = await _context.TiposMantenimientos.FindAsync(id);
        if (tipo is null) return NotFound();
        _context.TiposMantenimientos.Remove(tipo);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}