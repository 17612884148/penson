/**
 * 多功能在线工具箱网站 - 主要JavaScript函数
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化暗黑模式
    initDarkMode();
    
    // 初始化工具使用统计
    initToolUsageStats();
    
    // 初始化搜索功能
    initSearch();
    
    // 初始化滚动动画
    initScrollAnimations();
    
    // 初始化其他交互功能
    initInteractions();
});

/**
 * 初始化暗黑模式
 */
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;
    
    // 检查系统偏好和保存的主题
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    // 根据偏好设置初始主题
    if (savedTheme === 'dark' || (savedTheme === null && prefersDarkScheme)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // 监听切换事件
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // 监听系统颜色方案变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark-mode');
                darkModeToggle.checked = true;
            } else {
                document.body.classList.remove('dark-mode');
                darkModeToggle.checked = false;
            }
        }
    });
}

/**
 * 初始化工具使用统计
 */
function initToolUsageStats() {
    // 获取所有工具链接
    const toolLinks = document.querySelectorAll('a[href^="tools/"]');
    
    toolLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const toolName = this.textContent.trim();
            const toolUrl = this.getAttribute('href');
            
            // 增加使用次数统计
            incrementToolUsage(toolName, toolUrl);
        });
    });
}

/**
 * 增加工具使用统计
 * @param {string} toolName - 工具名称
 * @param {string} toolUrl - 工具URL
 */
function incrementToolUsage(toolName, toolUrl) {
    // 从localStorage获取当前统计数据
    let toolStats = JSON.parse(localStorage.getItem('toolUsageStats')) || {};
    
    // 如果该工具不存在统计记录，则初始化
    if (!toolStats[toolUrl]) {
        toolStats[toolUrl] = {
            name: toolName,
            count: 0,
            lastUsed: null
        };
    }
    
    // 更新统计
    toolStats[toolUrl].count += 1;
    toolStats[toolUrl].lastUsed = new Date().toISOString();
    
    // 保存回localStorage
    localStorage.setItem('toolUsageStats', JSON.stringify(toolStats));
    
    // 更新热门工具列表（如果在首页）
    updatePopularTools();
}

/**
 * 更新热门工具列表
 */
function updatePopularTools() {
    const popularToolsContainer = document.getElementById('popular-tools-container');
    if (!popularToolsContainer) return;
    
    // 获取工具统计
    const toolStats = JSON.parse(localStorage.getItem('toolUsageStats')) || {};
    
    // 转换为数组并排序
    const sortedTools = Object.keys(toolStats)
        .map(url => ({
            url: url,
            name: toolStats[url].name,
            count: toolStats[url].count,
            lastUsed: toolStats[url].lastUsed
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // 取前6个
    
    // 如果有热门工具，显示它们
    if (sortedTools.length > 0) {
        // 清空容器
        popularToolsContainer.innerHTML = '';
        
        // 添加工具卡片
        sortedTools.forEach(tool => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-lg-2 mb-4';
            
            col.innerHTML = `
                <a href="${tool.url}" class="text-decoration-none">
                    <div class="card h-100 tool-card text-center">
                        <div class="card-body">
                            <div class="tool-icon">
                                <i class="bi bi-star"></i>
                            </div>
                            <h5 class="card-title">${tool.name}</h5>
                            <p class="card-text small text-muted">使用次数: ${tool.count}</p>
                        </div>
                    </div>
                </a>
            `;
            
            popularToolsContainer.appendChild(col);
        });
    }
}

/**
 * 初始化搜索功能
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            resetSearch();
            return;
        }
        
        searchTools(searchTerm);
    });
}

/**
 * 搜索工具
 * @param {string} searchTerm - 搜索关键词
 */
function searchTools(searchTerm) {
    const toolItems = document.querySelectorAll('.list-group-item');
    const toolCategories = document.querySelectorAll('.tool-category');
    let hasResults = false;
    
    // 搜索所有工具项
    toolItems.forEach(item => {
        const toolName = item.textContent.toLowerCase();
        
        if (toolName.includes(searchTerm)) {
            item.style.display = 'block';
            hasResults = true;
            
            // 高亮匹配文本
            const link = item.querySelector('a');
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            link.innerHTML = link.textContent.replace(
                regex, 
                '<span class="search-highlight">$1</span>'
            );
        } else {
            item.style.display = 'none';
        }
    });
    
    // 隐藏空的分类
    toolCategories.forEach(category => {
        const visibleItems = category.querySelectorAll('.list-group-item[style="display: block"]');
        if (visibleItems.length === 0) {
            category.style.display = 'none';
        } else {
            category.style.display = 'block';
        }
    });
    
    // 显示搜索结果信息
    const searchResultsInfo = document.getElementById('search-results-info');
    if (searchResultsInfo) {
        if (hasResults) {
            searchResultsInfo.textContent = `找到与"${searchTerm}"相关的工具`;
            searchResultsInfo.style.display = 'block';
        } else {
            searchResultsInfo.textContent = `没有找到与"${searchTerm}"相关的工具`;
            searchResultsInfo.style.display = 'block';
        }
    }
}

/**
 * 重置搜索结果
 */
function resetSearch() {
    const toolItems = document.querySelectorAll('.list-group-item');
    const toolCategories = document.querySelectorAll('.tool-category');
    const searchResultsInfo = document.getElementById('search-results-info');
    
    // 重置所有工具项
    toolItems.forEach(item => {
        item.style.display = 'block';
        
        // 移除高亮
        const link = item.querySelector('a');
        link.innerHTML = link.textContent;
    });
    
    // 显示所有分类
    toolCategories.forEach(category => {
        category.style.display = 'block';
    });
    
    // 隐藏搜索结果信息
    if (searchResultsInfo) {
        searchResultsInfo.style.display = 'none';
    }
}

/**
 * 初始化滚动动画
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-up');
    
    // 如果没有动画元素，直接返回
    if (animatedElements.length === 0) return;
    
    // 创建IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // 观察所有动画元素
    animatedElements.forEach(el => {
        el.classList.remove('animate');
        observer.observe(el);
    });
}

/**
 * 初始化其他交互功能
 */
function initInteractions() {
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // 考虑固定导航栏的高度
                    behavior: 'smooth'
                });
                
                // 更新活动导航项
                const navLinks = document.querySelectorAll('.nav-pills .nav-link');
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // 添加滚动监听，自动更新导航活动项
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        // 获取所有分类标题元素
        const categories = document.querySelectorAll('.category-title');
        if (categories.length === 0) return;
        
        // 找到当前滚动位置对应的分类
        let currentCategory = null;
        categories.forEach(category => {
            const categoryTop = category.closest('.tool-category').offsetTop - 100;
            if (scrollPosition >= categoryTop) {
                const categoryId = category.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                currentCategory = categoryId;
            }
        });
        
        // 特殊处理热门工具区域
        const popularSection = document.getElementById('popular');
        if (popularSection && scrollPosition < categories[0].closest('.tool-category').offsetTop - 100) {
            currentCategory = 'popular';
        }
        
        // 更新导航活动项
        if (currentCategory) {
            const navLinks = document.querySelectorAll('.nav-pills .nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href').substring(1);
                if (href === currentCategory) {
                    link.classList.add('active');
                }
            });
        }
    });
} 