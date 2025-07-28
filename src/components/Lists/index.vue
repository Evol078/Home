<template>
    <div class="lists" v-if="listsData[0]">
        <div class="switch"><Icon size="20" @click="switchShowList"><Fan /></Icon></div>
        <div class="list" v-for="(list, index) in listsData" v-show="showListNum == index">
            <div class="line">
                <Icon size="20"><component :is="icons[list.icon] ? icons[list.icon] : Link" /></Icon><span class="title">{{ list.title }}</span>
            </div>
            <Swiper :modules="[Pagination, Mousewheel]" :observer="true" :observe-parents="true" :edge-swipe-detection="true" :slides-per-view="1" :space-between="40" :pagination="{ el: '.swiper-pagination', clickable: true, bulletElement: 'div', renderBullet: changeBullet }" :mousewheel="true">
                <SwiperSlide v-for="slide in list.items">
                    <el-row class="items" :gutter="20" data-swiper-parallax-x="200">
                        <el-col :span="8" v-for="(item, i) in slide.slice(0, 6)" :style="i >= 3 ? 'margin-top: 20px' : null">
                            <div class="item cards" @click="perform(item)">
                                <Icon size="26"><component :is="icons[item.icon] ? icons[item.icon] : Link" /></Icon>
                                <span class="name">{{ item.name }}</span>
                            </div>
                        </el-col>
                    </el-row>
                </SwiperSlide>
                <div class="pagination-wrapper">
                    <div class="swiper-pagination" v-show="list.items.length > 1"></div>
                </div>
            </Swiper>
        </div>
    </div>
</template>

<script setup>
    import { loadData } from '@/api';
    import { Icon } from "@vicons/utils";
    import { Error } from "@icon-park/vue-next";
    import { Bars, Blog, Book, Cloud, Code, Cog, CompactDisc, Fan, Link, Music, PencilAlt, Search, SlidersH, Train,ExclamationTriangle} from "@vicons/fa";

    import { mainStore } from "@/store";

    import { Swiper, SwiperSlide } from 'swiper/vue';
    import { Pagination, Mousewheel } from 'swiper';
    import "swiper/scss";

    const store = mainStore();

    // 图标名称与组件集合
    const icons = {
        "Bars": Bars,
        "Blog": Blog,
        "Book": Book,
        "Cloud": Cloud,
        "Code": Code,
        "Cog": Cog,
        "CompactDisc": CompactDisc,
        "Link": Link,
        "Music": Music,
        "PencilAlt": PencilAlt,
        "Search": Search,
        "SlidersH": SlidersH,
        "Train": Train,
        "ExclamationTriangle": ExclamationTriangle
    };

    const hitokoto = () => {
        store.musicOpenState = false;
    };

    const musicPlayer = () => {
        store.musicOpenState = true;
    };

    const musicList = () => {
        store.musicListShow = true;
    };

    const setting = () => {
        store.setOpenState = true;
    };

    let prankClickCount = ref(0);

    const prank = () => {
        prankClickCount.value++;
        let message = '当暴露在点击确定后的场景时，有极小部分人群会引发癲痫。这种情形可能是由于某些未查出的癫病症状引起，即使该人员并没有患癫痫病史也有可能造成此类病症。如果您的家人或任何家庭成员曾有过类似症状，请在点击确定前咨询您的医生或医师。如果您在稍后出现任何症状，包括头晕、目眩、眼部或肌肉抽搐、失去意识、失去方向感、抽搐或出现任何自己无法控制的动作，请立即关闭本站并咨询您的医生或医师。这是最后的警告，是否继续操作?';
        let confirmButtonText = '继续';
        let cancelButtonText = '取消';
        let type = 'warning';
        let showCancelButton = true;

        if (prankClickCount.value > 1) {
            message = '站长不会承担由于点击“千万别点”造成的任何后果（恼。这是最后的警告，是否继续操作？';
            confirmButtonText = '确认';
            type = 'error';
            showCancelButton = false;
        }

        ElMessageBox.confirm(
            message,
            '警告',
            {
                confirmButtonText,
                cancelButtonText,
                type,
                customClass: 'prank-message-box', // 添加自定义类名
                showCancelButton, // 控制是否显示取消按钮
                showClose: false,         // 1. 隐藏右上角 ×
                closeOnClickModal: false, // 2. 禁止点击遮罩关闭
                closeOnPressEscape: false // 3. 禁止按 ESC 关闭
            }
        ).then(() => {
            // 1. 跳转到恶搞页面
            window.showPrank();
            // 2. 回到主页后重新计数
            prankClickCount.value = 0;
        }).catch(() => {
            // 用户取消操作
        });
    };


    // 方法名称与方法集合
    const methods = {
        "hitokoto": hitokoto,
        "music": musicList,
        "player": musicPlayer,
        "setting": setting,
        "prank": prank
    };

    // 网站列表数据
    let listsData = ref([]);

    // 网站列表数量
    let listsNum = 1;

    // 当前显示的列表
    let showListNum = ref(0);

    const switchShowList = () => {
        showListNum.value = (showListNum.value + 1) % listsNum;
    };

    const loadWebsiteLists = () => {
        loadData(import.meta.env.VITE_LISTS_URL)
            .then((res) => {
                listsData.value = res;
                listsNum = res.length;

                console.log(listsData.value);
            })
            .catch((err) => {
                console.error(err);
                ElMessage({
                    message: "网站列表数据获取失败",
                    grouping: true,
                    icon: h(Error, {
                        theme: "filled",
                        fill: "#EFEFEF",
                    }),
                });
            });
    };

    // 方法执行 / 链接跳转
    const perform = (item) => {
        if (item.method) {
            methods[item.method]();
        } else {
            window.open(item.url, "_blank");
        }
    };

    const changeBullet = (index, className) => {
        return "<div class="+ className +"><span></span></div>";
    };

    onMounted(() => {
        loadWebsiteLists();
    });
</script>

<style lang="scss" scoped>
.lists{
    position: relative;
    .switch {
        position: absolute;
        top: 2px;
        right: 4px;

        .xicon {
            animation: rotate 1.5s linear infinite;
        }
    }

    .list {

        .line {
            display: flex;
            align-items: center;
            margin: 2rem 0.25rem 1rem;
            font-size: 1.1rem;
            animation: fade 0.5s;

            .title {
                margin-left: 8px;
                font-size: 1.15rem;
                text-shadow: 0 0 5px #00000050;
            }
        }

        .swiper {
            left: -10px;
            width: calc(100% + 20px);
            padding: 5px 10px 0 !important;
            z-index: 0 !important;

            .pagination-wrapper {
                display: flex;
                justify-content: center;
                align-content: center;
                position: relative;
                margin-top: 0.25rem;
                height: 24px;
                animation: fade 0.5s;
            
                .swiper-pagination {
                    padding: 0 7px;
                    border-radius: 12px;
                    font-size: 0;
                    transition: .25s;

                    :deep(.swiper-pagination-bullet) {
                        display: inline-block;
                        padding: 10px 3px;

                        span {
                            display: block;
                            width: 20px;
                            height: 4px;
                            background-color: rgba(0, 0, 0, 0.2509803922);
                            border-radius: 2px;
                            transition: .25s;
                        }

                        &:hover span {
                            background-color: rgba(255, 255, 255, 0.2509803922);
                        }

                        &:active span, &.swiper-pagination-bullet-active span {
                            background-color: rgba(255, 255, 255, 1);
                        }
                    }

                    // &:hover {
                    //     background-color: rgba(0, 0, 0, 0.2509803922);
                    //     backdrop-filter: blur(10px) !important;
                    // }
                }
            }

            .items {
                height: 220px;

                @media (max-width: 720px) {
                    height: 180px;
                }

                .item {
                    display: flex;
                    align-items: center;
                    flex-direction: row;
                    justify-content: center;
                    width: 100%;
                    height: 100px;
                    animation: fade 0.5s;

                    &:hover {
                        background: rgb(0 0 0 / 40%);
                        transform: scale(1.02);
                        transition: 0.3s;
                    }

                    &:active {
                        transform: scale(1);
                    }

                    .name {
                        margin-left: 8px;
                        font-size: 1.1rem;
                    }

                    @media (min-width: 721px) and (max-width: 820px) {
                        .name {
                            display: none;
                        }
                    }

                    @media (max-width: 720px) {
                        height: 80px;
                    }

                    @media (max-width: 460px) {
                        flex-direction: column;
                        
                        .name {
                            margin-top: 8px;
                            margin-left: 0;
                            font-size: 1rem;
                        }
                    }
                }
            }
        }
    }
}
</style>