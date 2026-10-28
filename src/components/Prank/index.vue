<script setup>
import { shallowRef, onBeforeUnmount } from 'vue';

const video = shallowRef(null);
const visible = shallowRef(false);
const status = shallowRef('loading');
const source = shallowRef();
// 可设置为对象存储/CDN的 HTTPS 视频直链；默认使用站内文件。
const videoUrl = import.meta.env.VITE_PRANK_VIDEO_URL || '/data/chunping.mp4';

function prepare() {
    source.value = videoUrl;
}

function close() {
    visible.value = false;
    video.value?.pause();
}

function play() {
    status.value = 'loading';
    const attempt = video.value?.play();
    attempt?.catch((error) => {
        if (!visible.value || error.name === 'AbortError') return;
        status.value = error.name === 'NotAllowedError' ? 'blocked' : 'error';
    });
}

function open() {
    // 同步设置媒体源并调用 play，尽量保留确认点击的用户手势。
    prepare();
    visible.value = true;
    if (video.value.getAttribute('src') !== videoUrl) video.value.src = videoUrl;
    video.value.currentTime = 0;
    play();
}

function retry() {
    video.value.load();
    play();
}

onBeforeUnmount(close);
defineExpose({ prepare, open });
</script>

<template>
    <Teleport to="body">
        <div v-show="visible" class="prank-layer" role="dialog" aria-modal="true" aria-label="整蛊视频">
            <video ref="video" :src="source" preload="auto" playsinline class="prank-video"
                @ended="close" @playing="status = 'playing'" @waiting="status = 'loading'"
                @error="status = 'error'" />
            <div class="prank-tip" aria-live="polite">
                <template v-if="status === 'loading'">视频加载中，请稍候…</template>
                <button v-else-if="status === 'blocked'" type="button" @click="play">点击播放视频</button>
                <button v-else-if="status === 'error'" type="button" @click="retry">视频加载失败，点击重试</button>
                <template v-else>播放完后自动关闭</template>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
button { cursor: pointer; padding: 8px 16px; border-radius: 6px; border: 1px solid #aaa; background: #222; color: #fff; }
</style>
