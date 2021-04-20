import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { PaintService } from './paint.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement>;

  context: CanvasRenderingContext2D;
  previousPoint: { x: number, y: number } | null = null;

  constructor(private paintService: PaintService) {
  }

  async ngAfterViewInit(): Promise<any> {
    const ctx = this.context = this.canvas.nativeElement.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    ctx.fillStyle = 'black';

    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer(async params => {
        const [handle] = params.files;
        if (handle) {
          const file = await handle.getFile();
          const image = await this.paintService.getImage(file);
          ctx.drawImage(image, 0, 0);
        }
      });
    }
  }

  onPointerDown(event: PointerEvent): void {
    this.previousPoint = { x: Math.floor(event.offsetX), y: Math.floor(event.offsetY) };
  }

  onPointerMove(canvas: HTMLCanvasElement, event: PointerEvent): void {
    if (this.previousPoint) {
      const currentPoint = { x: Math.floor(event.offsetX), y: Math.floor(event.offsetY) };
      for (const {x, y} of this.paintService.bresenhamLine(this.previousPoint.x, this.previousPoint.y, currentPoint.x, currentPoint.y)) {
        this.context.fillRect(x, y, 2, 2);
        this.previousPoint = currentPoint;
      }
    }
  }

  onPointerUp(): void {
    this.previousPoint = null;
  }

  async open(): Promise<any> {
    const [handle] = await (window as any).showOpenFilePicker();
    const file = await handle.getFile();
    const image = await this.paintService.getImage(file);
    this.context.drawImage(image, 0, 0);
  }

  async save(): Promise<any> {
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    const handle = await (window as any).showSaveFilePicker();
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }
}
