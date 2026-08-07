import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(
    value: Date | string | number | null | undefined,
    format: string = 'short',
  ): string {
    if (!value) return '';

    const datePipe = new DatePipe(
      this.translate.currentLang === 'ar' ? 'ar' : 'en',
    );
    return datePipe.transform(value, format) || '';
  }
}

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    currency: string = 'SAR',
  ): string {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}

@Pipe({
  name: 'uomFormat',
  standalone: true,
})
export class UomFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, uom: string = 'PC'): string {
    if (value === null || value === undefined) return '';

    return `${value} ${uom}`;
  }
}

@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit: number = 50): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + '...' : value;
  }
}

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (!bytes) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
