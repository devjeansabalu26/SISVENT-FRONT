import { TestBed } from '@angular/core/testing';
import { DatePanel } from './date-panel';
import { SelectPanel } from './select-panel';

describe('DatePanel', () => {
  function create(value = '', min = '', max = '') {
    const fixture = TestBed.createComponent(DatePanel);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('min', min);
    fixture.componentRef.setInput('max', max);
    fixture.detectChanges();
    return fixture;
  }

  it('abre en el mes del valor y la semana empieza el lunes', () => {
    const panel = create('2026-10-02').componentInstance;
    expect(panel.viewMonth()).toBe(9);
    expect(panel.viewYear()).toBe(2026);
    // Octubre 2026 empieza en jueves: la primera celda es el lunes 28 de septiembre.
    expect(panel.cells()[0].iso).toBe('2026-09-28');
    expect(panel.cells().length).toBe(42);
  });

  it('respeta min y max', () => {
    const panel = create('2026-10-10', '2026-10-05', '2026-10-20').componentInstance;
    expect(panel.isDisabled('2026-10-04')).toBeTrue();
    expect(panel.isDisabled('2026-10-21')).toBeTrue();
    expect(panel.isDisabled('2026-10-10')).toBeFalse();
  });

  it('emite la fecha elegida y vacío al limpiar', () => {
    const panel = create().componentInstance;
    const picked: string[] = [];
    panel.pick.subscribe((value) => picked.push(value));
    panel.choose('2026-10-02');
    panel.clear();
    expect(picked).toEqual(['2026-10-02', '']);
  });

  it('cambia de mes y de año al navegar', () => {
    const panel = create('2026-12-15').componentInstance;
    panel.shift(1);
    expect(panel.viewMonth()).toBe(0);
    expect(panel.viewYear()).toBe(2027);
  });
});

describe('SelectPanel', () => {
  const options = Array.from({ length: 10 }, (_, i) => ({ index: i, label: i === 3 ? 'Plin' : `Opción ${i}`, disabled: i === 5 }));

  function create() {
    const fixture = TestBed.createComponent(SelectPanel);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('selected', 2);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('muestra buscador con muchas opciones y filtra sin tildes ni mayúsculas', () => {
    const panel = create();
    expect(panel.searchable()).toBeTrue();
    panel.setQuery('PLÍN');
    expect(panel.visible().map((o) => o.index)).toEqual([3]);
  });

  it('no permite elegir opciones deshabilitadas', () => {
    const panel = create();
    const picked: number[] = [];
    panel.pick.subscribe((index) => picked.push(index));
    panel.choose(options[5]);
    panel.choose(options[3]);
    expect(picked).toEqual([3]);
  });
});
