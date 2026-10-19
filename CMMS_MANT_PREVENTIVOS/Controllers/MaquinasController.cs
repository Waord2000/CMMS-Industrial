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
public class MaquinasController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public MaquinasController(CmmsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaquinaDto>>> GetAll()
    {
        var maquinas = await _context.Maquinas
            .Include(m => m.Area)
            .Select(m => new MaquinaDto
            {
                MaquinaId = m.MaquinaId,
                Nombre = m.Nombre,
                AreaId = m.AreaId,
                NombreArea = m.Area.NombreArea,
                Marca = m.Marca,
                Estado = m.Estado,
                FechaCreacion = m.FechaCreacion
            })
            .ToListAsync();
        return Ok(maquinas);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaquinaDto>> GetById(int id)
    {
        var m = await _context.Maquinas.Include(x => x.Area).FirstOrDefaultAsync(x => x.MaquinaId == id);
        if (m is null) return NotFound();
        return Ok(new MaquinaDto
        {
            MaquinaId = m.MaquinaId,
            Nombre = m.Nombre,
            AreaId = m.AreaId,
            NombreArea = m.Area.NombreArea,
            Marca = m.Marca,
            Estado = m.Estado,
            FechaCreacion = m.FechaCreacion
        });
    }

    [HttpPost]
    public async Task<ActionResult<MaquinaDto>> Create(MaquinaCreateDto dto)
    {
        var areaExiste = await _context.Areas.AnyAsync(a => a.AreaId == dto.AreaId);
        if (!areaExiste) return BadRequest("El AreaId indicado no existe.");

        var maquina = new Maquina
        {
            Nombre = dto.Nombre,
            AreaId = dto.AreaId,
            Marca = dto.Marca,
            Estado = dto.Estado,
            FechaCreacion = DateTime.Now
        };
        _context.Maquinas.Add(maquina);
        await _context.SaveChangesAsync();

        await _context.Entry(maquina).Reference(m => m.Area).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = maquina.MaquinaId }, new MaquinaDto
        {
            MaquinaId = maquina.MaquinaId,
            Nombre = maquina.Nombre,
            AreaId = maquina.AreaId,
            NombreArea = maquina.Area.NombreArea,
            Marca = maquina.Marca,
            Estado = maquina.Estado,
            FechaCreacion = maquina.FechaCreacion
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, MaquinaCreateDto dto)
    {
        var maquina = await _context.Maquinas.FindAsync(id);
        if (maquina is null) return NotFound();

        var areaExiste = await _context.Areas.AnyAsync(a => a.AreaId == dto.AreaId);
        if (!areaExiste) return BadRequest("El AreaId indicado no existe.");

        maquina.Nombre = dto.Nombre;
        maquina.AreaId = dto.AreaId;
        maquina.Marca = dto.Marca;
        maquina.Estado = dto.Estado;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var maquina = await _context.Maquinas.FindAsync(id);
        if (maquina is null) return NotFound();
        _context.Maquinas.Remove(maquina);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}