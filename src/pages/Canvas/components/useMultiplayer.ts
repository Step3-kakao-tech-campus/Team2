import { TDAsset, TDBinding, TDShape, TDUser, TldrawApp } from '@tldraw/tldraw';
import { useCallback, useEffect, useRef } from 'react';
import {
    awareness,
    doc,
    wsProvider,
    undoManager,
    yBindings,
    yShapes,
    yAssets,
} from './store';

const MAX_ZOOM_LEVEL = 2; // 200%
const MIN_ZOOM_LEVEL = 1; // 100%

export function useMultiplayerState(roomId: string) {
    const tldrawRef = useRef<TldrawApp>();

    const onMount = useCallback(
        (app: TldrawApp) => {
            console.log('onMount');
            wsProvider.connect();
            app.loadRoom(roomId);
            app.pause();
            tldrawRef.current = app;
            handleChanges();
        },
        [roomId],
    );

    function handleChanges() {
        const tldraw = tldrawRef.current;

        if (!tldraw) return;
        const shapes = Object.fromEntries(yShapes.entries());
        const bindings = Object.fromEntries(yBindings.entries());
        const assets = Object.fromEntries(yAssets.entries());
        let filteredShapes: any = {};
        for (let key in shapes) {
            if (shapes[key].parentId === tldraw.currentPageId) {
                filteredShapes[key] = shapes[key];
            }
        }
        console.log('handleChanges', filteredShapes, bindings, assets);

        tldraw.replacePageContent(filteredShapes, bindings, assets);
    }

    const onChange = useCallback((app: TldrawApp) => {
        const { minX, minY, maxX, maxY, height, width } = app.viewport;
        const allowedArea = {
            minX: 0,
            minY: 0,
            width: 2000,
            height: 1500,
        };

        if (minX < allowedArea.minX) {
            app.setCamera([allowedArea.minX, -minY], app.camera.zoom, '');
        }
        if (minY < allowedArea.minY) {
            app.setCamera([-minX, allowedArea.minY], app.camera.zoom, '');
        }
        if (maxX > allowedArea.width) {
            app.setCamera(
                [-(allowedArea.width - width), -minY],
                app.camera.zoom,
                '',
            );
        }
        if (maxY > allowedArea.height) {
            app.setCamera(
                [-minX, -(allowedArea.height - height)],
                app.camera.zoom,
                '',
            );
        }

        if (app.pageState.camera.zoom > MAX_ZOOM_LEVEL) {
            app.pageState.camera.zoom = MAX_ZOOM_LEVEL;
            return;
        } else if (app.pageState.camera.zoom < MIN_ZOOM_LEVEL) {
            app.pageState.camera.zoom = MIN_ZOOM_LEVEL;
            return;
        }
    }, []);

    const onChangePage = useCallback(
        (
            app: TldrawApp,
            shapes: Record<string, TDShape | undefined>,
            bindings: Record<string, TDBinding | undefined>,
            assets: Record<string, TDAsset | undefined>,
        ) => {
            undoManager.stopCapturing();
            doc.transact(() => {
                Object.entries(shapes).forEach(([id, shape]) => {
                    if (!shape) {
                        yShapes.delete(id);
                    } else {
                        // console.log('shape', shape);
                        yShapes.set(shape.id, shape);
                    }
                });
                Object.entries(bindings).forEach(([id, binding]) => {
                    if (!binding) {
                        yBindings.delete(id);
                    } else {
                        // console.log('binding', binding);
                        yBindings.set(binding.id, binding);
                    }
                });
                Object.entries(assets).forEach(([id, asset]) => {
                    if (!asset) {
                        yAssets.delete(id);
                    } else {
                        // console.log('asset', asset);
                        yAssets.set(asset.id, asset);
                    }
                });
            });
        },
        [],
    );

    const onUndo = useCallback(() => {
        undoManager.undo();
    }, []);

    const onRedo = useCallback(() => {
        undoManager.redo();
    }, []);

    /**
     * Callback to update user's (self) presence
     */
    const onChangePresence = useCallback((app: TldrawApp, user: TDUser) => {
        awareness.setLocalStateField('tdUser', user);
        console.log('awareness', awareness);
    }, []);

    /**
     * Update app users whenever there is a change in the room users
     */
    useEffect(() => {
        const onChangeAwareness = () => {
            const tldraw = tldrawRef.current;

            if (!tldraw || !tldraw.room) return;

            const others = Array.from(awareness.getStates().entries())
                .filter(([key, _]) => key !== awareness.clientID)
                .map(([_, state]) => state)
                .filter(user => user.tdUser !== undefined);

            const ids = others.map(other => other.tdUser.id as string);

            Object.values(tldraw.room.users).forEach(user => {
                if (
                    user &&
                    !ids.includes(user.id) &&
                    user.id !== tldraw.room?.userId
                ) {
                    tldraw.removeUser(user.id);
                }
            });

            tldraw.updateUsers(
                others.map(other => other.tdUser).filter(Boolean),
            );
        };

        awareness.on('change', onChangeAwareness);

        return () => awareness.off('change', onChangeAwareness);
    }, []);

    useEffect(() => {
        yShapes.observeDeep(handleChanges);

        return () => yShapes.unobserveDeep(handleChanges);
    }, []);

    useEffect(() => {
        function handleDisconnect() {
            wsProvider.disconnect();
        }
        window.addEventListener('beforeunload', handleDisconnect);

        return () =>
            window.removeEventListener('beforeunload', handleDisconnect);
    }, []);

    return {
        onMount,
        onChange,
        onChangePage,
        onUndo,
        onRedo,
        onChangePresence,
    };
}
