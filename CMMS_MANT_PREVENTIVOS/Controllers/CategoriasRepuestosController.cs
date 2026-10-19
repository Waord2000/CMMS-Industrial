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
public class CategoriasRepuestoController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public CategoriasRepuestoController(CmmsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoriaRepuestoDto>>> GetAll()
    {
        var categorias = await _context.CategoriasRepuestos
            .Select(c => new CategoriaRepuestoDto { CategoriaId = c.CategoriaId, NombreCategoria = c.NombreCategoria })
            .ToListAsync();
        return Ok(categorias);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoriaRepuestoDto>> GetById(int id)
    {
        var categoria = await _context.CategoriasRepuestos.FindAsync(id);
        if (categoria is null) return NotFound();
        return Ok(new CategoriaRepuestoDto { CategoriaId = categoria.CategoriaId, NombreCategoria = categoria.NombreCategoria });
    }

    [HttpPost]
    public async Task<ActionResult<CategoriaRepuestoDto>> Create(CategoriaRepuestoCreateDto dto)
    {
        var categoria = new CategoriasRepuesto { NombreCategoria = dto.NombreCategoria };
        _context.CategoriasRepuestos.Add(categoria);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = categoria.CategoriaId },
            new CategoriaRepuestoDto { CategoriaId = categoria.CategoriaId, NombreCategoria = categoria.NombreCategoria });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CategoriaRepuestoCreateDto dto)
    {
        var categoria = await _context.CategoriasRepuestos.FindAsync(id);
        if (categoria is null) return NotFound();
        categoria.NombreCategoria = dto.NombreCategoria;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var categoria = await _context.CategoriasRepuestos.FindAsync(id);
        if (categoria is null) return NotFound();

        try
        {
            _context.CategoriasRepuestos.Remove(categoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se puede eliminar: hay repuestos asignados a esta categoría.");
        }
    }
}