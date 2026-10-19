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
public class ConsumoRepuestosController : ControllerBase
{
    private readonly CmmsDbContext _context;

    public ConsumoRepuestosController(CmmsDbContext context)
    {
        _context = context;
    }

    private static ConsumoRepuestoDto ToDto(ConsumoRepuesto c) => new()
    {
        ConsumoId = c.ConsumoId,
        OrdenId = c.OrdenId,
        RepuestoId = c.RepuestoId,
        NombreRepuesto = c.Repuesto.Nombre,
        UnidadMedida = c.Repuesto.UnidadMedida,
        Cantidad = c.Cantidad,
        CostoUnitario = c.Repuesto.CostoUnitario,
        CostoTotal = c.Cantidad * c.Repuesto.CostoUnitario,
        FechaConsumo = c.FechaConsumo
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConsumoRepuestoDto>>> GetAll()
    {
        var consumos = await _context.ConsumoRepuestos.Include(c => c.Repuesto)
            .Select(c => ToDto(c)).ToListAsync();
        return Ok(consumos);
    }

    [HttpGet("por-orden/{ordenId}")]
    public async Task<ActionResult<IEnumerable<ConsumoRepuestoDto>>> GetByOrden(int ordenId)
    {
        var consumos = await _context.ConsumoRepuestos.Include(c => c.Repuesto)
            .Where(c => c.OrdenId == ordenId)
            .Select(c => ToDto(c)).ToListAsync();
        return Ok(consumos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ConsumoRepuestoDto>> GetById(int id)
    {
        var c = await _context.ConsumoRepuestos.Include(x => x.Repuesto).FirstOrDefaultAsync(x => x.ConsumoId == id);
        if (c is null) return NotFound();
        return Ok(ToDto(c));
    }

    // Registra el consumo, descuenta el stock del repuesto, y deja el rastro en MovimientosInventario
    [HttpPost]
    public async Task<ActionResult<ConsumoRepuestoDto>> Create(ConsumoRepuestoCreateDto dto)
    {
        if (dto.Cantidad <= 0)
            return BadRequest("La cantidad debe ser mayor a 0.");

        var orden = await _context.OrdenesTrabajos.FindAsync(dto.OrdenId);
        if (orden is null) return BadRequest("La OrdenId indicada no existe.");

        var repuesto = await _context.Repuestos.FindAsync(dto.RepuestoId);
        if (repuesto is null) return BadRequest("El RepuestoId indicado no existe.");

        if (repuesto.StockActual < dto.Cantidad)
            return BadRequest($"Stock insuficiente. Disponible: {repuesto.StockActual}, solicitado: {dto.Cantidad}.");

        using var transaccion = await _context.Database.BeginTransactionAsync();

        var consumo = new ConsumoRepuesto
        {
            OrdenId = dto.OrdenId,
            RepuestoId = dto.RepuestoId,
            Cantidad = dto.Cantidad,
            FechaConsumo = DateTime.Now
        };
        _context.ConsumoRepuestos.Add(consumo);

        repuesto.StockActual -= dto.Cantidad;

        _context.MovimientosInventarios.Add(new MovimientosInventario
        {
            RepuestoId = dto.RepuestoId,
            TipoMovimiento = "Salida",
            Cantidad = dto.Cantidad,
            Fecha = DateTime.Now,
            OrdenId = dto.OrdenId,
            Observaciones = $"Consumo registrado en orden #{dto.OrdenId}"
        });

        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        var creado = await _context.ConsumoRepuestos.Include(c => c.Repuesto).FirstAsync(c => c.ConsumoId == consumo.ConsumoId);
        return CreatedAtAction(nameof(GetById), new { id = consumo.ConsumoId }, ToDto(creado));
    }

    // Elimina el consumo y REVIERTE el stock (por si se registró por error)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var consumo = await _context.ConsumoRepuestos.FindAsync(id);
        if (consumo is null) return NotFound();

        using var transaccion = await _context.Database.BeginTransactionAsync();

        var repuesto = await _context.Repuestos.FindAsync(consumo.RepuestoId);
        if (repuesto is not null) repuesto.StockActual += consumo.Cantidad;

        _context.MovimientosInventarios.Add(new MovimientosInventario
        {
            RepuestoId = consumo.RepuestoId,
            TipoMovimiento = "Entrada",
            Cantidad = consumo.Cantidad,
            Fecha = DateTime.Now,
            OrdenId = consumo.OrdenId,
            Observaciones = $"Reversión por eliminación de consumo #{id}"
        });

        _context.ConsumoRepuestos.Remove(consumo);
        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        return NoContent();
    }
}