import { isDemoAction } from './demo-lock';

function element(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild!;
}

describe('isDemoAction', () => {
  it('bloquea las acciones que guardan o cambian datos', () => {
    [
      '<a class="primary"><span class="material-icons">add</span>Nuevo producto</a>',
      '<button type="submit">Guardar cambios</button>',
      '<button><span class="material-icons">block</span>Anular venta</button>',
      '<button><span class="material-icons">lock_open</span>Abrir caja</button>',
      '<button class="new-customer">+ Nuevo cliente</button>',
      '<button title="Eliminar"><span class="material-icons">delete</span></button>',
      '<button title="Marcar salida"><span class="material-icons">logout</span></button>',
      '<button><span class="material-icons">edit</span></button>',
      '<button mat-menu-item>Desactivar</button>',
      '<button class="primary"><span class="material-icons">inventory</span>Recibir mercadería</button>',
    ].forEach((html) => expect(isDemoAction(element(html))).withContext(html).toBeTrue());
  });

  it('deja libres la navegación, los filtros y las consultas', () => {
    [
      '<button class="primary">Filtrar</button>',
      '<button class="primary">Cerrar</button>',
      '<button>Cancelar</button>',
      '<button class="primary"><span class="material-icons">print</span>Imprimir</button>',
      '<button class="primary"><span class="material-icons">download</span>Exportar CSV</button>',
      '<button title="Ver detalle"><span class="material-icons">visibility</span></button>',
      '<button>Siguiente</button>',
      '<a href="/app/products">Productos</a>',
    ].forEach((html) => expect(isDemoAction(element(html))).withContext(html).toBeFalse());
  });
});
