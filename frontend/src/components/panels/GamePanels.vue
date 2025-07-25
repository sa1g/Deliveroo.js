<script setup>
    
    import { ref, computed } from 'vue';
    import Settings from './Settings.vue';
    import ParcelSpawner from './ParcelSpawner.vue';
    import Timer from './Timer.vue';
    import Levels from '../modals/Levels.vue';
    import Maps from '../modals/Maps.vue';
    import Modal from '../modals/Modal.vue';
    import Login from '../modals/Login.vue';
    import Keyboard from './Keyboard.vue';
    import { connection } from '../../states/myConnection.js';
    import AgentsPanels from './AgentsPanel.vue';
    import ParcelsPanels from './ParcelsPanel.vue';
    import ToolsPanel from './ToolsPanel.vue';
    import VersionPanel from './VersionPanel.vue';
    import ChatPanel from './ChatPanel.vue';
    import Chrono from './Chrono.vue';
    import Tournament from './Tournament.vue';

    const levelsModal = ref(false); // Reactive variable for overlay visibility
    const mapsModal = ref(false); // Reactive variable for overlay visibility
    const loginModal = ref(!connection); // Reactive variable for overlay visibility
    const settingsModal = ref(false); // Reactive variable for overlay visibility

    const admin = computed(() => {
        return connection?.payload?.role == 'admin';
    });
    const grid = connection?.grid;
    const me = grid?.me;
    const clock = grid?.clock;

    function restartGame() {
        connection.socket.emit('restart');
    }

    const chatOpen = ref(false);

</script>

<template>
    <main class="text-sm text-neutral-content">

        <Modal v-model="loginModal" title="Login / Signup">
            <Login/>
        </Modal>

        <Modal v-model="levelsModal" title="Load level">
            <Levels @load-level="levelsModal=false;"/>
        </Modal>

        <Modal v-model="mapsModal" title="Change map">
            <Maps @load-map="mapsModal=false;"/>
        </Modal>

        <Modal v-model="settingsModal" title="Server settings">
            <div class="px-40 py-10 space-y-4">
                <Settings v-if="connection"/>
                <ParcelSpawner v-if="connection"/>
            </div>
        </Modal>
            
        <div class="fixed z-10 left-0 top-1 ml-20 px-2 text-neutral-content">
            <VersionPanel/>
        </div>

        <div id="left-dashboard" class="fixed z-10 top-14 max-h-screen text-sm">

            <div class="ml-4 mb-2 z-10 grid grid-flow-col gap-2 font-mono text-center text-xs w-80" style="overflow: visible;" v-if="connection?.payload.role == 'admin'">
                <Chrono />
            </div>

            <div class="overflow-scroll" style="max-height: calc(100vh - 5rem); direction: rtl">
                <div class="flex flex-col space-y-2" style="direction: ltr; overflow: unset;">

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral" v-if="connection?.payload.role == 'admin'">
                        <input type="checkbox" checked />
                        <div class="collapse-title font-medium">Tournament</div>
                        <div class="collapse-content overflow-hidden p-0" style="min-height:auto!important">

                            <Tournament/>
                            
                        </div>
                    </div>

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-80 hover:opacity-100">
                        <input type="checkbox" />
                        <div class="collapse-title font-medium">Agents</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">

                            <AgentsPanels/>

                        </div>
                    </div>

                    <!-- <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90" v-if="connection?.payload.role == 'admin'">
                        <input type="checkbox" />
                        <div class="collapse-title font-medium">Parcels ({{ connection?.grid.parcels.size }} of a maximum of {{ connection?.configs.PARCELS_MAX }})</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">

                            <ParcelsPanels/>
                            
                        </div>
                    </div> -->

                    <!-- <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90" v-if="connection?.payload.role == 'admin'">
                        <input type="checkbox" checked />
                        <div class="collapse-title font-medium">Tools</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">

                            <ToolsPanel />

                        </div>
                    </div> -->
                
                </div>
            </div>
        </div>
        
        <div id="right-dashboard" class="text-sm">
            <div class="fixed z-10 w-80 right-4 top-4 max-h-full">
                <div class="flex flex-col h-full rounded-lg space-y-2">
                    
                    <Timer class="z-10" :timer="clock?.ms" :frames="clock?.frame"/>
                    
                    <div class="z-10 grid grid-flow-col gap-2 text-center text-xs w-80">
                        <button class="btn btn-info btn-sm" @click="loginModal=true"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                                <path stroke="currentColor" stroke-width="2" d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                            </svg>
                            <div class="tooltip tooltip-warning tooltip-left"
                                 :data-tip="`${me?.name}(${me?.id}) ${me?.teamName?me.teamName+'('+me?.teamId+')':''} socket=${connection?.socket.id}`"
                            >
                                <span> {{ me?.name?.slice(0,10) }}({{ me?.id }}) </span>
                                <span v-if="me?.x"> {{ me?.x ? Math.floor(me?.x)+','+Math.floor(me?.y) : '' }} </span>
                            </div>
                        </button>
                        <button class="btn btn-info btn-sm" @click="restartGame" v-bind:disabled="!admin" v-if="admin">
                            <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" alt="Restart">
                                <rect x="14" y="4" width="4" height="20" rx="2"/>
                                <ellipse cx="16" cy="29" rx="9" ry="8" />
                            </svg>
                        </button>
                        <button class="btn btn-info btn-sm" @click="settingsModal=true;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div class="z-10 grid grid-flow-col gap-2 text-center">
                        <button class="btn btn-info btn-sm overflow-hidden" @click="mapsModal=true;"
                                v-bind:disabled="!admin" v-bind:class="{'!opacity-100 !text-white': !admin}"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                                <path fill-rule="evenodd" d="M8.157 2.176a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.25v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.452 4.26 1.762a1.5 1.5 0 0 0 1.146 0l4.083-1.69A1.5 1.5 0 0 0 18 14.75V3.872a1.5 1.5 0 0 0-2.073-1.386l-3.51 1.452-4.26-1.762ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clip-rule="evenodd" />
                            </svg>
                            {{ connection?.configs.MAP_FILE }}
                        </button>
                        <button class="btn btn-info btn-sm overflow-hidden" @click="levelsModal=true;"
                                v-bind:disabled="!admin" v-bind:class="{'!opacity-100 !text-white': !admin}"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7ZM8 16a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1-5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9Z" clip-rule="evenodd"/>
                            </svg>
                            {{ connection?.configs.LEVEL }}
                        </button>
                    </div>

                    <Keyboard class="z-10"/>
                    
                    <div class="z-10 collapse collapse-arrow bg-neutral opacity-80 hover:opacity-100 min-h-16 max-h-64">
                        <input type="checkbox" v-model="chatOpen"/>
                        <div class="collapse-title font-medium pb-0">
                            Chat
                            <div class="text-xs" v-if="connection?.msgs.length > 0 && ! chatOpen">
                                {{ connection?.msgs[connection.msgs.length-1]?.name }}: {{ connection?.msgs[connection.msgs.length-1]?.msg }} <br/>
                            </div>
                            <div class="text-xs" v-if="connection?.msgs.length == 0">
                                No messages yet
                            </div>
                        </div>
                        <div id="chat" class="collapse-content">
                            <ChatPanel />
                        </div>
                    </div>
                    
                    <div class="z-10 collapse collapse-arrow bg-neutral opacity-80 hover:opacity-100 min-h-16 max-h-96">
                        <input type="checkbox" />
                        <div class="collapse-title font-medium">
                            Server Logs
                            <div class="text-xs pb-2" v-if="connection?.serverLogs.length > 0">
                                {{ connection?.serverLogs[connection.serverLogs.length-1]?.message.join(" ") }} <br/>
                            </div>
                        </div>
                        <div id="logs" class="collapse-content overflow-auto" style="min-height:auto!important">
                            <div v-for="{ms, frame, message} of connection?.serverLogs" class="text-xs pb-2">
                                <span v-for="m of message"> {{ m }} </span>
                                <br/>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>

    </main>
</template>

<style>
</style>