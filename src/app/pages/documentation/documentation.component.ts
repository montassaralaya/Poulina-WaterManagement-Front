import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ import this

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [RouterModule], // ✅ add RouterModule
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css']
})
export class DocumentationComponent implements OnInit {
  constructor(
    private viewportScroller: ViewportScroller,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const fragment = window.location.hash.substr(1);
      if (fragment) {
        setTimeout(() => {
          this.scrollToSection(fragment);
        }, 100);
      }
    }
  }

  scrollToSection(section: string) {
    this.viewportScroller.scrollToAnchor(section);
  }
}
