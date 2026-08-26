# Motion map

| 场景 | 触发 | 行为 | 降级 |
|---|---|---|---|
| Footer reveal | 滚动到底部 | Footer 从页面后方全屏揭示 | reduced motion 直接显示 |
| Hands | Footer 进入视口 | 左右手从两侧进入并随指针轻微视差 | 触屏保持静态 |
| ASCII hover | 指针进入手部 | 邻近字符成簇高亮 | 无精确指针时关闭 |
| Type reveal | Footer 进入视口 | 链接、正文与标题按行/字进入 | reduced motion 直接显示 |

持续动画必须在离屏时暂停。
