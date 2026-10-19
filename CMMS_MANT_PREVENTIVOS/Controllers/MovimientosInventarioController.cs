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
public class MovimientosInventarioController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public MovimientosInventarioController(CmmsDbContext context)
    {
        _context = context;
    }

    private static MovimientoInventarioDto ToDto(MovimientosInventario m) => new()
    {
        MovimientoId = m.MovimientoId,
        RepuestoId = m.RepuestoId,
        NombreRepuesto = m.Repuesto.Nombre,
        TipoMovimiento = m.TipoMovimiento,
        Cantidad = m.Cantidad,
        Fecha = m.Fecha,
        OrdenId = m.OrdenId,
        Observaciones = m.Observaciones
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MovimientoInventarioDto>>> GetAll()
    {
        var movimientos = await _context.MovimientosInventarios.Include(m => m.Repuesto)
            .OrderByDescending(m => m.Fecha)
            .Select(m => ToDto(m)).ToListAsync();
        return Ok(movimientos);
    }

    [HttpGet("por-repuesto/{repuestoId}")]
    public async Task<ActionResult<IEnumerable<MovimientoInventarioDto>>> GetByRepuesto(int repuestoId)
    {
        var movimientos = await _context.MovimientosInventarios.Include(m => m.Repuesto)
            .Where(m => m.RepuestoId == repuestoId)
            .OrderByDescending(m => m.Fecha)
            .Select(m => ToDto(m)).ToListAsync();
        return Ok(movimientos);
    }

    // Registra reposición de stock (compra) y aumenta StockActual del repuesto
    [HttpPost("entrada")]
    public async Task<ActionResult<MovimientoInventarioDto>> RegistrarEntrada(EntradaInventarioCreateDto dto)
    {
        if (dto.Cantidad <= 0)
            return BadRequest("La cantidad debe ser mayor a 0.");

        var repuesto = await _context.Repuestos.FindAsync(dto.RepuestoId);
        if (repuesto is null) return BadRequest("El RepuestoId indicado no existe.");

        using var transaccion = await _context.Database.BeginTransactionAsync();

        repuesto.StockActual += dto.Cantidad;

        var movimiento = new MovimientosInventario
        {
            RepuestoId = dto.RepuestoId,
            TipoMovimiento = "Entrada",
            Cantidad = dto.Cantidad,
            Fecha = DateTime.Now,
            Observaciones = dto.Observaciones ?? "Reposición de stock"
        };
        _context.MovimientosInventarios.Add(movimiento);

        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        var creado = await _context.MovimientosInventarios.Include(m => m.Repuesto).FirstAsync(m => m.MovimientoId == movimiento.MovimientoId);
        return CreatedAtAction(nameof(GetByRepuesto), new { repuestoId = dto.RepuestoId }, ToDto(creado));
    }
}