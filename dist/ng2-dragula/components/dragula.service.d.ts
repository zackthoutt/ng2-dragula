import { Group } from '../Group';
import { DragulaOptions } from '../DragulaOptions';
import { Observable } from 'rxjs';
import { DrakeFactory } from '../DrakeFactory';
import * as i0 from "@angular/core";
export declare class DragulaService {
    private drakeFactory;
    private groups;
    private dispatch$;
    private elContainerSource;
    cancel: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        container: Element;
        source: Element;
    }>;
    remove: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        container: Element;
        source: Element;
    }>;
    shadow: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        container: Element;
        source: Element;
    }>;
    over: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        container: Element;
        source: Element;
    }>;
    out: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        container: Element;
        source: Element;
    }>;
    drag: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        source: Element;
    }>;
    dragend: (groupName?: string) => Observable<{
        name: string;
        el: Element;
    }>;
    drop: (groupName?: string) => Observable<{
        name: string;
        el: Element;
        target: Element;
        source: Element;
        sibling: Element;
    }>;
    cloned: (groupName?: string) => Observable<{
        name: string;
        clone: Element;
        original: Element;
        cloneType: "mirror" | "copy";
    }>;
    dropModel: <T = any>(groupName?: string) => Observable<{
        name: string;
        el: Element;
        target: Element;
        source: Element;
        sibling: Element;
        item: T;
        sourceModel: T[];
        targetModel: T[];
        sourceIndex: number;
        targetIndex: number;
    }>;
    removeModel: <T = any>(groupName?: string) => Observable<{
        name: string;
        el: Element;
        container: Element;
        source: Element;
        item: T;
        sourceModel: T[];
        sourceIndex: number;
    }>;
    constructor(drakeFactory: DrakeFactory);
    /** Public mainly for testing purposes. Prefer `createGroup()`. */
    add(group: Group): Group;
    find(name: string): Group;
    destroy(name: string): void;
    /**
     * Creates a group with the specified name and options.
     *
     * Note: formerly known as `setOptions`
     */
    createGroup<T = any>(name: string, options: DragulaOptions<T>): Group;
    private handleModels;
    private setupEvents;
    private domIndexOf;
    static ɵfac: i0.ɵɵFactoryDeclaration<DragulaService, [{ optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DragulaService>;
}
//# sourceMappingURL=dragula.service.d.ts.map