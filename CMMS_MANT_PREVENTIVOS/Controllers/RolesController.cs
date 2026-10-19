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
public class RolesController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public RolesController(CmmsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RolDto>>> GetAll()
    {
        var roles = await _context.Roles
            .Select(r => new RolDto { RolId = r.RolId, NombreRol = r.NombreRol, Descripcion = r.Descripcion })
            .ToListAsync();
        return Ok(roles);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RolDto>> GetById(int id)
    {
        var rol = await _context.Roles.FindAsync(id);
        if (rol is null) return NotFound();
        return Ok(new RolDto { RolId = rol.RolId, NombreRol = rol.NombreRol, Descripcion = rol.Descripcion });
    }

    [HttpPost]
    public async Task<ActionResult<RolDto>> Create(RolCreateDto dto)
    {
        var rol = new Role { NombreRol = dto.NombreRol, Descripcion = dto.Descripcion };
        _context.Roles.Add(rol);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = rol.RolId },
            new RolDto { RolId = rol.RolId, NombreRol = rol.NombreRol, Descripcion = rol.Descripcion });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, RolCreateDto dto)
    {
        var rol = await _context.Roles.FindAsync(id);
        if (rol is null) return NotFound();
        rol.NombreRol = dto.NombreRol;
        rol.Descripcion = dto.Descripcion;
        await _context.SaveChangesAsync();
        return NoContent();
    }
    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rol = await _context.Roles.FindAsync(id);
        if (rol is null) return NotFound();
        _context.Roles.Remove(rol);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
