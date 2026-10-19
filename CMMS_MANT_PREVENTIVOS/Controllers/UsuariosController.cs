using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.Data.Models;
using CMMS_MANT_PREVENTIVOS.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public UsuariosController(CmmsDbContext context)
    {
        _context = context;
    }

    private static byte[] HashContrasena(string contrasena) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(contrasena));

    private static UsuarioDto ToDto(Usuario u) => new()
    {
        UsuarioId = u.UsuarioId,
        NombreCompleto = u.NombreCompleto,
        CorreoElectronico = u.CorreoElectronico,
        RolId = u.RolId,
        NombreRol = u.Rol.NombreRol,
        Activo = u.Activo,
        FechaCreacion = u.FechaCreacion
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetAll()
    {
        var usuarios = await _context.Usuarios.Include(u => u.Rol).Select(u => ToDto(u)).ToListAsync();
        return Ok(usuarios);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UsuarioDto>> GetById(int id)
    {
        var u = await _context.Usuarios.Include(x => x.Rol).FirstOrDefaultAsync(x => x.UsuarioId == id);
        if (u is null) return NotFound();
        return Ok(ToDto(u));
    }
    [Authorize(Roles = "Administrador")]
    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Create(UsuarioCreateDto dto)
    {
        if (!await _context.Roles.AnyAsync(r => r.RolId == dto.RolId))
            return BadRequest("El RolId indicado no existe.");
        if (await _context.Usuarios.AnyAsync(u => u.CorreoElectronico == dto.CorreoElectronico))
            return BadRequest("Ya existe un usuario con ese correo electrónico.");
        if (string.IsNullOrWhiteSpace(dto.Contrasena) || dto.Contrasena.Length < 8)
            return BadRequest("La contraseña debe tener al menos 8 caracteres.");

        var usuario = new Usuario
        {
            NombreCompleto = dto.NombreCompleto,
            CorreoElectronico = dto.CorreoElectronico,
            ContrasenaHash = HashContrasena(dto.Contrasena),
            RolId = dto.RolId,
            Activo = dto.Activo,
            FechaCreacion = DateTime.Now
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        await _context.Entry(usuario).Reference(u => u.Rol).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = usuario.UsuarioId }, ToDto(usuario));
    }
    [Authorize(Roles = "Administrador")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UsuarioCreateDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound();

        if (!await _context.Roles.AnyAsync(r => r.RolId == dto.RolId))
            return BadRequest("El RolId indicado no existe.");

        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.CorreoElectronico = dto.CorreoElectronico;
        usuario.RolId = dto.RolId;
        usuario.Activo = dto.Activo;
        // Solo re-hashea si mandaron una contraseña nueva (no vacía)
        if (!string.IsNullOrWhiteSpace(dto.Contrasena))
            usuario.ContrasenaHash = HashContrasena(dto.Contrasena);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound();
        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}