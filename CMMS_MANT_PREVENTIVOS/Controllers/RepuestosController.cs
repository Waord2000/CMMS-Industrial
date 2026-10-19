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
public class RepuestosController : ControllerBase
{
    // Para agregar otra unidad, súmala aquí y en src/Utils/unidades.js del frontend
    private static readonly string[] UnidadesPermitidas = { "Unidad", "Litro", "Galón", "Gramo", "Libra" };

    private readonly CmmsDbContext _context;

    public RepuestosController(CmmsDbContext context)
    {
        _context = context;
    }

    private static RepuestoDto ToDto(Repuesto r) => new()
    {
        RepuestoId = r.RepuestoId,
        Codigo = r.Codigo,
        Nombre = r.Nombre,
        CategoriaId = r.CategoriaId,
        NombreCategoria = r.Categoria.NombreCategoria,
        UnidadMedida = r.UnidadMedida,
        StockMinimo = r.StockMinimo,
        StockActual = r.StockActual,
        CostoUnitario = r.CostoUnitario
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RepuestoDto>>> GetAll()
    {
        var repuestos = await _context.Repuestos.Include(r => r.Categoria)
            .Select(r => ToDto(r)).ToListAsync();
        return Ok(repuestos);
    }

    // Repuestos cuyo stock actual ya llegó o bajó del mínimo
    [HttpGet("stock-bajo")]
    public async Task<ActionResult<IEnumerable<RepuestoDto>>> GetStockBajo()
    {
        var repuestos = await _context.Repuestos.Include(r => r.Categoria)
            .Where(r => r.StockActual <= r.StockMinimo)
            .Select(r => ToDto(r)).ToListAsync();
        return Ok(repuestos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RepuestoDto>> GetById(int id)
    {
        var r = await _context.Repuestos.Include(x => x.Categoria).FirstOrDefaultAsync(x => x.RepuestoId == id);
        if (r is null) return NotFound();
        return Ok(ToDto(r));
    }

    [Authorize(Roles = "Administrador,Supervisor")]
    [HttpPost]
    public async Task<ActionResult<RepuestoDto>> Create(RepuestoCreateDto dto)
    {
        var codigo = (dto.Codigo ?? string.Empty).Trim();
        if (codigo.Length == 0)
            return BadRequest("El código es obligatorio.");
        if (!UnidadesPermitidas.Contains(dto.UnidadMedida))
            return BadRequest("La unidad de medida no es válida.");
        if (!await _context.CategoriasRepuestos.AnyAsync(c => c.CategoriaId == dto.CategoriaId))
            return BadRequest("El CategoriaId indicado no existe.");

        var existente = await _context.Repuestos.FirstOrDefaultAsync(r => r.Codigo == codigo);
        if (existente is not null)
            return BadRequest($"El código '{codigo}' ya está en uso por el repuesto «{existente.Nombre}».");

        var repuesto = new Repuesto
        {
            Codigo = codigo,
            Nombre = dto.Nombre,
            CategoriaId = dto.CategoriaId,
            UnidadMedida = dto.UnidadMedida,
            StockMinimo = dto.StockMinimo,
            StockActual = dto.StockActual,
            CostoUnitario = dto.CostoUnitario
        };

        _context.Repuestos.Add(repuesto);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se pudo guardar el repuesto. Verifica que el código no esté repetido.");
        }

        await _context.Entry(repuesto).Reference(r => r.Categoria).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = repuesto.RepuestoId }, ToDto(repuesto));
    }

    [Authorize(Roles = "Administrador,Supervisor")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, RepuestoCreateDto dto)
    {
        var repuesto = await _context.Repuestos.FindAsync(id);
        if (repuesto is null) return NotFound();

        var codigo = (dto.Codigo ?? string.Empty).Trim();
        if (codigo.Length == 0)
            return BadRequest("El código es obligatorio.");
        if (!UnidadesPermitidas.Contains(dto.UnidadMedida))
            return BadRequest("La unidad de medida no es válida.");
        if (!await _context.CategoriasRepuestos.AnyAsync(c => c.CategoriaId == dto.CategoriaId))
            return BadRequest("El CategoriaId indicado no existe.");

        var existente = await _context.Repuestos.FirstOrDefaultAsync(r => r.Codigo == codigo && r.RepuestoId != id);
        if (existente is not null)
            return BadRequest($"El código '{codigo}' ya está en uso por el repuesto «{existente.Nombre}».");

        repuesto.Codigo = codigo;
        repuesto.Nombre = dto.Nombre;
        repuesto.CategoriaId = dto.CategoriaId;
        repuesto.UnidadMedida = dto.UnidadMedida;
        repuesto.StockMinimo = dto.StockMinimo;
        repuesto.StockActual = dto.StockActual;
        repuesto.CostoUnitario = dto.CostoUnitario;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se pudo guardar el repuesto. Verifica que el código no esté repetido.");
        }

        return NoContent();
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var repuesto = await _context.Repuestos.FindAsync(id);
        if (repuesto is null) return NotFound();

        _context.Repuestos.Remove(repuesto);
        try
        {
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest("No se puede eliminar: el repuesto está en uso (tiene consumos, movimientos o máquinas asignadas).");
        }
    }
}