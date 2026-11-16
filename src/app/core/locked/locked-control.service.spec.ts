import { lockedReason } from './locked-control.service';

describe('lockedReason', () => {
  let main: HTMLElement;

  beforeEach(() => {
    main = document.createElement('main');
    document.body.appendChild(main);
  });

  afterEach(() => main.remove());

  it('devuelve el motivo declarado cuando el control está deshabilitado', () => {
    main.innerHTML = '<label data-locked="No se puede desactivar."><span>Texto</span><input type="checkbox" disabled /></label>';
    expect(lockedReason(main.querySelector('span'))).toBe('No se puede desactivar.');
    expect(lockedReason(main.querySelector('input'))).toBe('No se puede desactivar.');
  });

  it('no avisa si el control con motivo está habilitado', () => {
    main.innerHTML = '<label data-locked="Elige primero el local."><input type="number" /></label>';
    expect(lockedReason(main.querySelector('input'))).toBeNull();
  });

  it('usa un mensaje genérico para campos deshabilitados sin motivo', () => {
    main.innerHTML = '<label>Campo<input disabled /></label>';
    expect(lockedReason(main.querySelector('label'))).toBe('Esta opción no se puede cambiar en este momento.');
  });

  it('ignora campos habilitados y selectores de archivo', () => {
    main.innerHTML = '<input id="a" /><input id="b" type="file" disabled />';
    expect(lockedReason(main.querySelector('#a'))).toBeNull();
    expect(lockedReason(main.querySelector('#b'))).toBeNull();
  });
});
