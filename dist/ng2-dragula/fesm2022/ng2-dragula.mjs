import * as i0 from '@angular/core';
import { Injectable, Optional, EventEmitter, Directive, Input, Output, NgModule } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as dragulaExpt from 'dragula';

class Group {
    constructor(name, drake, options) {
        this.name = name;
        this.drake = drake;
        this.options = options;
        this.initEvents = false;
    }
}

var EventTypes;
(function (EventTypes) {
    EventTypes["Cancel"] = "cancel";
    EventTypes["Cloned"] = "cloned";
    EventTypes["Drag"] = "drag";
    EventTypes["DragEnd"] = "dragend";
    EventTypes["Drop"] = "drop";
    EventTypes["Out"] = "out";
    EventTypes["Over"] = "over";
    EventTypes["Remove"] = "remove";
    EventTypes["Shadow"] = "shadow";
    EventTypes["DropModel"] = "dropModel";
    EventTypes["RemoveModel"] = "removeModel";
})(EventTypes || (EventTypes = {}));
const AllEvents = Object.keys(EventTypes).map(k => EventTypes[k]);

const dragula = dragulaExpt.default || dragulaExpt;
class DrakeFactory {
    constructor(build = dragula) {
        this.build = build;
    }
}

const filterEvent = (eventType, filterDragType, projector) => (input) => {
    return input.pipe(filter(({ event, name }) => {
        return (event === eventType &&
            (filterDragType === undefined || name === filterDragType));
    }), map(({ name, args }) => projector(name, args)));
};
const elContainerSourceProjector = (name, [el, container, source]) => ({ name, el, container, source });
class DragulaService {
    constructor(drakeFactory) {
        this.drakeFactory = drakeFactory;
        this.groups = {};
        this.dispatch$ = new Subject();
        this.elContainerSource = (eventType) => (groupName) => this.dispatch$.pipe(filterEvent(eventType, groupName, elContainerSourceProjector));
        /* https://github.com/bevacqua/dragula#drakeon-events */
        // eslint-disable-next-line @typescript-eslint/member-ordering
        this.cancel = this.elContainerSource(EventTypes.Cancel);
        // eslint-disable-next-line @typescript-eslint/member-ordering
        this.remove = this.elContainerSource(EventTypes.Remove);
        // eslint-disable-next-line @typescript-eslint/member-ordering
        this.shadow = this.elContainerSource(EventTypes.Shadow);
        // eslint-disable-next-line @typescript-eslint/member-ordering
        this.over = this.elContainerSource(EventTypes.Over);
        // eslint-disable-next-line @typescript-eslint/member-ordering
        this.out = this.elContainerSource(EventTypes.Out);
        this.drag = (groupName) => this.dispatch$.pipe(filterEvent(EventTypes.Drag, groupName, (name, [el, source]) => ({ name, el, source })));
        this.dragend = (groupName) => this.dispatch$.pipe(filterEvent(EventTypes.DragEnd, groupName, (name, [el]) => ({
            name,
            el,
        })));
        this.drop = (groupName) => this.dispatch$.pipe(filterEvent(EventTypes.Drop, groupName, (name, [el, target, source, sibling]) => {
            return { name, el, target, source, sibling };
        }));
        this.cloned = (groupName) => this.dispatch$.pipe(filterEvent(EventTypes.Cloned, groupName, (name, [clone, original, cloneType]) => {
            return { name, clone, original, cloneType };
        }));
        this.dropModel = (groupName) => this.dispatch$.pipe(filterEvent(EventTypes.DropModel, groupName, (name, [el, target, source, sibling, item, sourceModel, targetModel, sourceIndex, targetIndex,]) => {
            return {
                name,
                el,
                target,
                source,
                sibling,
                item,
                sourceModel,
                targetModel,
                sourceIndex,
                targetIndex,
            };
        }));
        this.removeModel = (groupName) => this.dispatch$.pipe(filterEvent(EventTypes.RemoveModel, groupName, (name, [el, container, source, item, sourceModel, sourceIndex]) => {
            return {
                name,
                el,
                container,
                source,
                item,
                sourceModel,
                sourceIndex,
            };
        }));
        if (this.drakeFactory === null || this.drakeFactory === undefined) {
            this.drakeFactory = new DrakeFactory();
        }
    }
    /** Public mainly for testing purposes. Prefer `createGroup()`. */
    add(group) {
        const existingGroup = this.find(group.name);
        if (existingGroup) {
            throw new Error('Group named: "' + group.name + '" already exists.');
        }
        this.groups[group.name] = group;
        this.handleModels(group);
        this.setupEvents(group);
        return group;
    }
    find(name) {
        return this.groups[name];
    }
    destroy(name) {
        const group = this.find(name);
        if (!group) {
            return;
        }
        group.drake && group.drake.destroy();
        delete this.groups[name];
    }
    /**
     * Creates a group with the specified name and options.
     *
     * Note: formerly known as `setOptions`
     */
    createGroup(name, options) {
        return this.add(new Group(name, this.drakeFactory.build([], options), options));
    }
    handleModels({ name, drake, options }) {
        let dragElm;
        let dragIndex;
        let dropIndex;
        drake.on('remove', (el, container, source) => {
            if (!drake.models) {
                return;
            }
            let sourceModel = drake.models[drake.containers.indexOf(source)];
            sourceModel = sourceModel.slice(0); // clone it
            const item = sourceModel.splice(dragIndex, 1)[0];
            this.dispatch$.next({
                event: EventTypes.RemoveModel,
                name,
                args: [el, container, source, item, sourceModel, dragIndex],
            });
        });
        drake.on('drag', (el, source) => {
            if (!drake.models) {
                return;
            }
            dragElm = el;
            dragIndex = this.domIndexOf(el, source);
        });
        drake.on('drop', (dropElm, target, source, sibling) => {
            if (!drake.models || !target) {
                return;
            }
            dropIndex = this.domIndexOf(dropElm, target);
            let sourceModel = drake.models[drake.containers.indexOf(source)];
            let targetModel = drake.models[drake.containers.indexOf(target)];
            let item;
            if (target === source) {
                sourceModel = sourceModel.slice(0);
                item = sourceModel.splice(dragIndex, 1)[0];
                sourceModel.splice(dropIndex, 0, item);
                // this was true before we cloned and updated sourceModel,
                // but targetModel still has the old value
                targetModel = sourceModel;
            }
            else {
                const isCopying = dragElm !== dropElm;
                item = sourceModel[dragIndex];
                if (isCopying) {
                    if (!options.copyItem) {
                        throw new Error('If you have enabled `copy` on a group, you must provide a `copyItem` function.');
                    }
                    item = options.copyItem(item);
                }
                if (!isCopying) {
                    sourceModel = sourceModel.slice(0);
                    sourceModel.splice(dragIndex, 1);
                }
                targetModel = targetModel.slice(0);
                targetModel.splice(dropIndex, 0, item);
                if (isCopying) {
                    try {
                        target.removeChild(dropElm);
                        // eslint-disable-next-line no-empty
                    }
                    catch (e) { }
                }
            }
            this.dispatch$.next({
                event: EventTypes.DropModel,
                name,
                args: [
                    dropElm,
                    target,
                    source,
                    sibling,
                    item,
                    sourceModel,
                    targetModel,
                    dragIndex,
                    dropIndex,
                ],
            });
        });
    }
    setupEvents(group) {
        if (group.initEvents) {
            return;
        }
        group.initEvents = true;
        const name = group.name;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        const emitter = (event) => {
            switch (event) {
                case EventTypes.Drag:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                case EventTypes.Drop:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                case EventTypes.DragEnd:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                case EventTypes.Cancel:
                case EventTypes.Remove:
                case EventTypes.Shadow:
                case EventTypes.Over:
                case EventTypes.Out:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                case EventTypes.Cloned:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                case EventTypes.DropModel:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                case EventTypes.RemoveModel:
                    group.drake.on(event, (...args) => {
                        this.dispatch$.next({ event, name, args });
                    });
                    break;
                default:
                    break;
            }
        };
        AllEvents.forEach(emitter);
    }
    domIndexOf(child, parent) {
        if (parent) {
            return Array.prototype.indexOf.call(parent.children, child);
        }
    }
    static { this.ɵfac = function DragulaService_Factory(t) { return new (t || DragulaService)(i0.ɵɵinject(DrakeFactory, 8)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: DragulaService, factory: DragulaService.ɵfac, providedIn: 'root' }); }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(DragulaService, [{
        type: Injectable,
        args: [{
                providedIn: 'root',
            }]
    }], function () { return [{ type: DrakeFactory, decorators: [{
                type: Optional
            }] }]; }, null); })();

class DragulaDirective {
    get container() {
        return this.el && this.el.nativeElement;
    }
    constructor(el, dragulaService) {
        this.el = el;
        this.dragulaService = dragulaService;
        this.dragulaModelChange = new EventEmitter();
    }
    ngOnChanges(changes) {
        if (changes && changes.dragula) {
            const { previousValue: prev, currentValue: current, firstChange } = changes.dragula;
            const hadPreviousValue = !!prev;
            const hasNewValue = !!current;
            // something -> null       =>  teardown only
            // something -> something  =>  teardown, then setup
            //      null -> something  =>  setup only
            //
            //      null -> null (precluded by fact of change being present)
            if (hadPreviousValue) {
                this.teardown(prev);
            }
            if (hasNewValue) {
                this.setup();
            }
        }
        else if (changes && changes.dragulaModel) {
            // this code only runs when you're not changing the group name
            // because if you're changing the group name, you'll be doing setup or teardown
            // it also only runs if there is a group name to attach to.
            const { previousValue: prev, currentValue: current, firstChange } = changes.dragulaModel;
            const drake = this.group?.drake;
            if (this.dragula && drake) {
                drake.models = drake.models || [];
                const prevIndex = drake.models.indexOf(prev);
                if (prevIndex !== -1) {
                    // delete the previous
                    drake.models.splice(prevIndex, 1);
                    // maybe insert a new one at the same spot
                    if (current) {
                        drake.models.splice(prevIndex, 0, current);
                    }
                }
                else if (current) {
                    // no previous one to remove; just push this one.
                    drake.models.push(current);
                }
            }
        }
    }
    // call ngOnInit 'setup' because we want to call it in ngOnChanges
    // and it would otherwise run twice
    setup() {
        const checkModel = (group) => {
            if (this.dragulaModel) {
                if (group.drake?.models) {
                    group.drake?.models?.push(this.dragulaModel);
                }
                else {
                    if (group.drake) {
                        group.drake.models = [this.dragulaModel];
                    }
                }
            }
        };
        // find or create a group
        if (!this.dragula) {
            return;
        }
        let group = this.dragulaService.find(this.dragula);
        if (!group) {
            const options = {};
            group = this.dragulaService.createGroup(this.dragula, options);
        }
        // ensure model and container element are pushed
        checkModel(group);
        group.drake?.containers.push(this.container);
        this.subscribe(this.dragula);
        this.group = group;
    }
    subscribe(name) {
        this.subs = new Subscription();
        this.subs.add(this.dragulaService
            .dropModel(name)
            .subscribe(({ source, target, sourceModel, targetModel }) => {
            if (source === this.el.nativeElement) {
                this.dragulaModelChange.emit(sourceModel);
            }
            else if (target === this.el.nativeElement) {
                this.dragulaModelChange.emit(targetModel);
            }
        }));
        this.subs.add(this.dragulaService
            .removeModel(name)
            .subscribe(({ source, sourceModel }) => {
            if (source === this.el.nativeElement) {
                this.dragulaModelChange.emit(sourceModel);
            }
        }));
    }
    teardown(groupName) {
        if (this.subs) {
            this.subs.unsubscribe();
        }
        const group = this.dragulaService.find(groupName);
        if (group) {
            const itemToRemove = group.drake?.containers.indexOf(this.el.nativeElement);
            if (itemToRemove !== -1) {
                group.drake?.containers.splice(itemToRemove, 1);
            }
            if (this.dragulaModel && group.drake && group.drake.models) {
                const modelIndex = group.drake.models.indexOf(this.dragulaModel);
                if (modelIndex !== -1) {
                    group.drake.models.splice(modelIndex, 1);
                }
            }
        }
    }
    ngOnDestroy() {
        if (!this.dragula) {
            return;
        }
        this.teardown(this.dragula);
    }
    static { this.ɵfac = function DragulaDirective_Factory(t) { return new (t || DragulaDirective)(i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(DragulaService)); }; }
    static { this.ɵdir = /*@__PURE__*/ i0.ɵɵdefineDirective({ type: DragulaDirective, selectors: [["", "dragula", ""]], inputs: { dragula: "dragula", dragulaModel: "dragulaModel" }, outputs: { dragulaModelChange: "dragulaModelChange" }, features: [i0.ɵɵNgOnChangesFeature] }); }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(DragulaDirective, [{
        type: Directive,
        args: [{ selector: '[dragula]' }]
    }], function () { return [{ type: i0.ElementRef }, { type: DragulaService }]; }, { dragula: [{
            type: Input
        }], dragulaModel: [{
            type: Input
        }], dragulaModelChange: [{
            type: Output
        }] }); })();

class DragulaModule {
    static forRoot() {
        return {
            ngModule: DragulaModule,
            providers: [DragulaService]
        };
    }
    static { this.ɵfac = function DragulaModule_Factory(t) { return new (t || DragulaModule)(); }; }
    static { this.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: DragulaModule }); }
    static { this.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({ providers: [DragulaService] }); }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(DragulaModule, [{
        type: NgModule,
        args: [{
                exports: [DragulaDirective],
                declarations: [DragulaDirective],
                providers: [DragulaService]
            }]
    }], null, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(DragulaModule, { declarations: [DragulaDirective], exports: [DragulaDirective] }); })();

const MockDrakeFactory = new DrakeFactory((containers, options) => {
    return new MockDrake(containers, options);
});
/** You can use MockDrake to simulate Drake events.
 *
 * The three methods that actually do anything are `on(event, listener)`,
 * `destroy()`, and a new method, `emit()`. Use `emit()` to manually emit Drake
 * events, and if you injected MockDrake properly with MockDrakeFactory or
 * mocked the DragulaService.find() method, then you can make ng2-dragula think
 * drags and drops are happening.
 *
 * Caveats:
 *
 * 1. YOU MUST MAKE THE DOM CHANGES YOURSELF.
 * 2. REPEAT: YOU MUST MAKE THE DOM CHANGES YOURSELF.
 *    That means `source.removeChild(el)`, and `target.insertBefore(el)`.
 * 3. None of the other methods do anything.
 *    That's ok, because ng2-dragula doesn't use them.
 */
class MockDrake {
    /**
     * @param containers A list of container elements.
     * @param options These will NOT be used. At all.
     * @param models Nonstandard, but useful for testing using `new MockDrake()` directly.
     *               Note, default value is undefined, like a real Drake. Don't change that.
     */
    constructor(containers = [], options = {}, models) {
        this.containers = containers;
        this.options = options;
        this.models = models;
        // Basic but fully functional event emitter shim
        this.emitter$ = new Subject();
        this.subs = new Subscription();
        /* Doesn't represent anything meaningful. */
        this.dragging = false;
    }
    on(event, callback) {
        this.subs.add(this.emitter$
            .pipe(filter(({ eventType }) => eventType === event))
            .subscribe(({ eventType, args }) => {
            if (eventType === EventTypes.Drag) {
                const argument = Array.from(args);
                const el = argument[0];
                const source = argument[1];
                //@ts-ignore
                callback(el, source);
                return;
            }
            if (eventType === EventTypes.Drop) {
                const argument = Array.from(args);
                const el = argument[0];
                const target = argument[1];
                const source = argument[2];
                const sibling = argument[3];
                //@ts-ignore
                callback(el, target, source, sibling);
                return;
            }
            if (eventType === EventTypes.Remove) {
                const argument = Array.from(args);
                const el = argument[0];
                const container = argument[1];
                const source = argument[2];
                //@ts-ignore
                callback(el, container, source);
                return;
            }
            callback(args);
        }));
    }
    /* Does nothing useful. */
    start(item) {
        this.dragging = true;
    }
    /* Does nothing useful. */
    end() {
        this.dragging = false;
    }
    cancel(revert) {
        this.dragging = false;
    }
    /* Does nothing useful. */
    canMove(item) {
        return this.options.accepts ? this.options.accepts(item) : false;
    }
    /* Does nothing useful. */
    remove() {
        this.dragging = false;
    }
    destroy() {
        this.subs.unsubscribe();
    }
    /**
     * This is the most useful method. You can use it to manually fire events that would normally
     * be fired by a real drake.
     *
     * You're likely most interested in firing `drag`, `remove` and `drop`, the three events
     * DragulaService uses to implement [dragulaModel].
     *
     * See https://github.com/bevacqua/dragula#drakeon-events for what you should emit (and in what order).
     *
     * (Note also, firing dropModel and removeModel won't work. You would have to mock DragulaService for that.)
     */
    emit(eventType, ...args) {
        this.emitter$.next({ eventType, args });
    }
}

/**
 * Generated bundle index. Do not edit.
 */

export { DragulaDirective, DragulaModule, DragulaService, DrakeFactory, EventTypes, Group, MockDrake, MockDrakeFactory, dragula };
//# sourceMappingURL=ng2-dragula.mjs.map
