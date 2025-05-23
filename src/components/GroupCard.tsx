import React, { useState } from "react";
import { Site } from "../API/http";
import SiteCard from "./SiteCard";
import { GroupWithSites } from "../types";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
// 引入Material UI组件
import { Paper, Typography, Button, Box } from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";

// 更新组件属性接口
interface GroupCardProps {
    group: GroupWithSites;
    index?: number; // 用于Draggable的索引，仅在分组排序模式下需要
    sortMode: "None" | "GroupSort" | "SiteSort";
    currentSortingGroupId: number | null;
    onUpdate: (updatedSite: Site) => void;
    onDelete: (siteId: number) => void;
    onSaveSiteOrder: (groupId: number, sites: Site[]) => void;
    onStartSiteSort: (groupId: number) => void;
    onAddSite?: (groupId: number) => void; // 新增添加卡片的可选回调函数
}

const GroupCard: React.FC<GroupCardProps> = ({
    group,
    sortMode,
    currentSortingGroupId,
    onUpdate,
    onDelete,
    onSaveSiteOrder,
    onStartSiteSort,
    onAddSite,
}) => {
    // 添加本地状态来管理站点排序
    const [sites, setSites] = useState<Site[]>(group.sites);

    // 配置传感器，支持鼠标、触摸和键盘操作
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px 的移动才激活拖拽，防止误触
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // 延迟250ms激活，防止误触
                tolerance: 5, // 容忍5px的移动
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 站点拖拽结束处理函数
    const handleSiteDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            // 查找拖拽的站点索引
            const oldIndex = sites.findIndex(site => `site-${site.id}` === active.id);
            const newIndex = sites.findIndex(site => `site-${site.id}` === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // 更新本地站点顺序
                const newSites = arrayMove(sites, oldIndex, newIndex);
                setSites(newSites);
            }
        }
    };

    // 判断是否为当前正在编辑的分组
    const isCurrentEditingGroup = sortMode === "SiteSort" && currentSortingGroupId === group.id;

    // 渲染站点卡片区域
    const renderSites = () => {
        // 使用本地状态中的站点数据
        const sitesToRender = isCurrentEditingGroup ? sites : group.sites;

        // 如果当前不是正在编辑的分组且处于站点排序模式，不显示站点
        if (!isCurrentEditingGroup && sortMode === "SiteSort") {
            return null;
        }

        // 如果是编辑模式，使用DndContext包装
        if (isCurrentEditingGroup) {
            return (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSiteDragEnd}
                >
                    <SortableContext
                        items={sitesToRender.map(site => `site-${site.id}`)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <Box sx={{ width: "100%" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    margin: -1, // 抵消内部padding，确保边缘对齐
                                }}
                            >
                                {sitesToRender.map((site, idx) => (
                                    <Box
                                        key={site.id || idx}
                                        sx={{
                                            width: {
                                                xs: "50%",
                                                sm: "50%",
                                                md: "25%",
                                                lg: "25%",
                                                xl: "25%",
                                            },
                                            padding: 1, // 内部间距，更均匀的分布
                                            boxSizing: "border-box", // 确保padding不影响宽度计算
                                        }}
                                    >
                                        <SiteCard
                                            site={site}
                                            onUpdate={onUpdate}
                                            onDelete={onDelete}
                                            isEditMode={true}
                                            index={idx}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </SortableContext>
                </DndContext>
            );
        }

        // 普通模式下的渲染
        return (
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    margin: -1, // 抵消内部padding，确保边缘对齐
                }}
            >
                {sitesToRender.map(site => (
                    <Box
                        key={site.id}
                        sx={{
                            width: {
                                xs: "50%",
                                sm: "50%",
                                md: "25%",
                                lg: "25%",
                                xl: "25%",
                            },
                            padding: 1, // 内部间距，更均匀的分布
                            boxSizing: "border-box", // 确保padding不影响宽度计算
                        }}
                    >
                        <SiteCard
                            site={site}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            isEditMode={false}
                        />
                    </Box>
                ))}
            </Box>
        );
    };

    // 保存站点排序
    const handleSaveSiteOrder = () => {
        onSaveSiteOrder(group.id!, sites);
    };

    // 正常模式或站点排序模式下渲染完整的分组卡片
    return (
        <Paper
            elevation={sortMode === "None" ? 2 : 3}
            sx={{
                borderRadius: 4,
                p: 3,
                transition: "all 0.3s ease-in-out",
                border: "1px solid transparent",
                "&:hover": {
                    boxShadow: sortMode === "None" ? 6 : 3,
                    borderColor: "divider",
                    transform: sortMode === "None" ? "scale(1.01)" : "none",
                },
            }}
        >
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={2.5}>
                <Typography variant='h5' component='h2' fontWeight='600' color='text.primary'>
                    {group.name}
                </Typography>

                <Box>
                    {isCurrentEditingGroup ? (
                        <Button
                            variant='contained'
                            color='primary'
                            size='small'
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSiteOrder}
                        >
                            保存顺序
                        </Button>
                    ) : (
                        sortMode === "None" && (
                            <>
                                {onAddSite && (
                                    <Button
                                        variant='contained'
                                        color='primary'
                                        size='small'
                                        onClick={() => onAddSite(group.id!)}
                                        sx={{ mr: 1 }}
                                        startIcon={<AddIcon />}
                                    >
                                        添加卡片
                                    </Button>
                                )}
                                <Button
                                    variant='outlined'
                                    color='primary'
                                    size='small'
                                    startIcon={<SortIcon />}
                                    onClick={() => onStartSiteSort(group.id!)}
                                >
                                    排序
                                </Button>
                            </>
                        )
                    )}
                </Box>
            </Box>

            {/* 站点卡片区域 */}
            {renderSites()}
        </Paper>
    );
};

export default GroupCard;
