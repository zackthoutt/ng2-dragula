import { ElementRef, OnChanges, OnDestroy, SimpleChange, EventEmitter } from '@angular/core';
import { DragulaService } from './dragula.service';
import * as i0 from "@angular/core";
export declare class DragulaDirective implements OnChanges, OnDestroy {
    private el;
    private dragulaService;
    dragula?: string;
    dragulaModel?: any[];
    dragulaModelChange: EventEmitter<any[]>;
    private subs?;
    private get container();
    private group?;
    constructor(el: ElementRef, dragulaService: DragulaService);
    ngOnChanges(changes: {
        dragula?: SimpleChange;
        dragulaModel?: SimpleChange;
    }): void;
    setup(): void;
    subscribe(name: string): void;
    teardown(groupName: string): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DragulaDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<DragulaDirective, "[dragula]", never, { "dragula": { "alias": "dragula"; "required": false; }; "dragulaModel": { "alias": "dragulaModel"; "required": false; }; }, { "dragulaModelChange": "dragulaModelChange"; }, never, never, false, never>;
}
//# sourceMappingURL=dragula.directive.d.ts.map