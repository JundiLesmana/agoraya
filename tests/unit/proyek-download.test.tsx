// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { downloadData } from '@/app/(public)/data-pemerintah/proyek/_components/download-button';

describe('downloadData', () => {
  it('memicu unduhan file CSV data proyek', () => {
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('mock-blob-url');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    downloadData();

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);

    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect(anchor.download).toBe('data-proyek.csv');
    expect(anchor.getAttribute('href')).toBe('mock-blob-url');
    expect(anchor.style.display).toBe('none');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(anchor);
    expect(revokeSpy).toHaveBeenCalledWith('mock-blob-url');

    createObjectURLSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
