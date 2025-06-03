/**
 * 工具箱网站搜索功能
 * 支持工具名称、描述和标签搜索，增强用户体验
 * 包含搜索历史和热门搜索词功能
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsStatus = document.getElementById('searchResultsStatus');
    const searchEnhancerContainer = document.getElementById('searchEnhancerContainer');
    const searchHistoryTags = document.getElementById('searchHistoryTags');
    const popularSearchTags = document.getElementById('popularSearchTags');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const searchHistorySection = document.getElementById('searchHistorySection');
    
    console.log("搜索模块初始化");
    
    // 显示搜索历史区域
    function showSearchHistory() {
        if (searchHistorySection) {
            // 如果已经显示，则不需要处理
            if (searchHistorySection.style.display === 'block') {
                return;
            }
            
            // 设置显示之前先添加动画类
            searchHistorySection.classList.add('fade-in');
            searchHistorySection.style.display = 'block';
            
            // 更新历史记录显示
            updateSearchHistoryDisplay();
            
            // 动画完成后移除动画类
            setTimeout(() => {
                searchHistorySection.classList.remove('fade-in');
            }, 300);
        }
    }
    
    // 隐藏搜索历史区域
    function hideSearchHistory() {
        if (searchHistorySection && searchInput.value.trim() === '') {
            // 设置透明度为0，触发过渡效果
            searchHistorySection.style.opacity = '0';
            searchHistorySection.style.transform = 'translateY(-10px)';
            
            // 等待过渡完成后设置display为none
            setTimeout(() => {
                searchHistorySection.style.display = 'none';
                // 重置样式，为下次显示做准备
                searchHistorySection.style.opacity = '';
                searchHistorySection.style.transform = '';
            }, 300);
        }
    }
    
    // 确保搜索历史容器宽度与输入框组匹配
    function updateSearchEnhancerPosition() {
        const inputGroup = searchInput.closest('.input-group');
        if (inputGroup && searchEnhancerContainer) {
            // 获取输入框组的宽度和位置
            const inputRect = inputGroup.getBoundingClientRect();
            
            // 设置搜索增强器的宽度和位置
            searchEnhancerContainer.style.width = inputRect.width + 'px';
            searchEnhancerContainer.style.left = '50%';
            searchEnhancerContainer.style.transform = 'translateX(-50%)';
            
            console.log("已更新搜索增强器位置，宽度:", inputRect.width);
        }
    }
    
    // 页面加载和窗口大小改变时更新搜索增强器位置
    window.addEventListener('resize', updateSearchEnhancerPosition);
    window.addEventListener('load', updateSearchEnhancerPosition);
    
    // 输入框聚焦时显示搜索历史
    searchInput.addEventListener('focus', function() {
        // 更新搜索增强器位置
        updateSearchEnhancerPosition();
        
        // 显示搜索历史区域
        showSearchHistory();
    });
    
    // 输入框失去焦点时，如果没有内容则隐藏搜索历史
    searchInput.addEventListener('blur', function(e) {
        // 添加延时，防止点击搜索历史标签时因为失焦而隐藏导致无法点击
        setTimeout(() => {
            // 检查点击的元素是否在搜索历史区域内
            const activeElement = document.activeElement;
            const isHistoryRelated = searchHistorySection.contains(activeElement) || 
                                     activeElement === clearHistoryBtn || 
                                     activeElement.classList.contains('search-tag');
            
            // 如果不是点击了搜索历史相关元素，并且输入框没有内容，则隐藏搜索历史
            if (!isHistoryRelated && searchInput.value.trim() === '') {
                hideSearchHistory();
            }
        }, 200);
    });
    
    // 输入框内容变化时的处理
    searchInput.addEventListener('input', function() {
        // 有内容时显示搜索历史，无内容且不聚焦时隐藏
        if (this.value.trim() !== '') {
            showSearchHistory();
            
            // 如果输入内容为空且已经显示了搜索结果，则隐藏搜索结果
            if (searchResultsContainer.style.display !== 'none') {
                hideSearchResults();
            }
        } else if (!this.matches(':focus')) {
            hideSearchHistory();
        }
    });
    
    // 初始化工具数据
    let toolsData = [];
    
    // 创建搜索结果容器
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'searchResults';
    searchResultsContainer.className = 'container mb-5';
    searchResultsContainer.style.display = 'none';
    
    // 创建搜索结果标题和返回按钮
    const searchResultsHeader = document.createElement('div');
    searchResultsHeader.className = 'row mb-4';
    searchResultsHeader.innerHTML = `
        <div class="col-12 d-flex justify-content-between align-items-center">
            <h2 class="search-results-title">搜索结果</h2>
            <button id="backToAllTools" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-2"></i>返回所有工具
            </button>
        </div>
    `;
    
    // 创建搜索结果内容区域
    const searchResultsContent = document.createElement('div');
    searchResultsContent.className = 'row';
    searchResultsContent.id = 'searchResultsContent';
    
    // 组装搜索结果容器
    searchResultsContainer.appendChild(searchResultsHeader);
    searchResultsContainer.appendChild(searchResultsContent);
    
    // 将搜索结果容器插入到页面中
    const popularToolsSection = document.querySelector('#popular');
    if (popularToolsSection) {
        popularToolsSection.parentElement.insertBefore(
            searchResultsContainer, 
            popularToolsSection
        );
        console.log("搜索结果容器已添加到页面");
    } else {
        console.error("未找到热门工具区域，无法添加搜索结果容器");
    }
    
    // 返回所有工具按钮点击事件
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'backToAllTools' || e.target.closest('#backToAllTools'))) {
            console.log("点击返回所有工具按钮");
            hideSearchResults();
            // 清空搜索框
            searchInput.value = '';
        }
    });
    
    // 搜索历史管理
    function getSearchHistory() {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    }
    
    function saveSearchHistory(query) {
        if (!query.trim()) return;
        
        let history = getSearchHistory();
        // 如果已存在，则删除旧条目
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        // 添加到最前面
        history.unshift(query);
        // 只保留最近10条记录
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        localStorage.setItem('searchHistory', JSON.stringify(history));
        updateSearchHistoryDisplay();
    }
    
    function clearSearchHistory() {
        localStorage.removeItem('searchHistory');
        updateSearchHistoryDisplay();
    }
    
    function updateSearchHistoryDisplay() {
        const history = getSearchHistory();
        searchHistoryTags.innerHTML = '';
        
        if (history.length === 0) {
            searchHistoryTags.innerHTML = '<p class="text-muted mb-0">暂无搜索记录</p>';
            return;
        }
        
        history.forEach(item => {
            const tag = document.createElement('span');
            tag.className = 'search-tag bg-light rounded';
            tag.textContent = item;
            tag.addEventListener('click', function() {
                searchInput.value = item;
                performSearch(item);
                // 确保搜索历史区域保持显示
                showSearchHistory();
            });
            searchHistoryTags.appendChild(tag);
        });
    }
    
    // 初始化搜索历史显示
    updateSearchHistoryDisplay();
    
    // 清除历史按钮点击事件
    clearHistoryBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearSearchHistory();
    });
    
    // 热门搜索词点击事件
    const popularTags = popularSearchTags.querySelectorAll('.search-tag');
    popularTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const query = this.textContent;
            searchInput.value = query;
            performSearch(query);
            // 确保搜索历史区域保持显示
            showSearchHistory();
        });
    });
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            console.log("搜索按钮被点击，搜索关键词：", query);
            
            // 显示搜索历史区域
            showSearchHistory();
            
            // 添加loading状态
            const originalButtonHTML = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            this.disabled = true;
            
            try {
                // 执行搜索
                performSearch(query);
                console.log("搜索完成");
            } catch (error) {
                console.error("搜索过程中出错:", error);
                searchResultsStatus.innerHTML = `
                    <div class="alert alert-danger">
                        搜索出错，请重试
                    </div>
                `;
                searchResultsStatus.style.display = 'block';
            } finally {
                // 恢复按钮状态
                this.innerHTML = originalButtonHTML;
                this.disabled = false;
                // 移除enhancer-visible类
                searchInput.closest('.input-group').classList.remove('enhancer-visible');
            }
        }
    });
    
    // 输入框Enter键事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                console.log("按下Enter键，搜索关键词：", query);
                
                // 显示搜索历史区域
                showSearchHistory();
                
                // 添加loading状态
                const originalButtonHTML = searchButton.innerHTML;
                searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                searchButton.disabled = true;
                
                try {
                    // 执行搜索
                    performSearch(query);
                    console.log("搜索完成");
                } catch (error) {
                    console.error("搜索过程中出错:", error);
                    searchResultsStatus.innerHTML = `
                        <div class="alert alert-danger">
                            搜索出错，请重试
                        </div>
                    `;
                    searchResultsStatus.style.display = 'block';
                } finally {
                    // 恢复按钮状态
                    searchButton.innerHTML = originalButtonHTML;
                    searchButton.disabled = false;
                    // 移除enhancer-visible类
                    searchInput.closest('.input-group').classList.remove('enhancer-visible');
                }
            }
        }
    });
    
    // 不再需要点击页面其他地方关闭搜索增强器的事件处理，因为搜索历史已经永久显示
    // 保留这个事件处理器，但修改逻辑，仅用于处理enhancer-visible类
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchButton.contains(e.target)) {
            searchInput.closest('.input-group').classList.remove('enhancer-visible');
        }
    });
    
    // 从标题中提取标签
    function getTagsFromTitle(title) {
        if (!title) return [];
        
        const tags = [];
        const words = title.toLowerCase().split(/[\s,\-_]+/);
        
        // 添加原始词汇作为标签
        tags.push(...words);
        
        // 常见词汇的同义词映射
        const synonyms = {
            '图片': ['image', 'photo', 'picture'],
            '视频': ['video', 'movie'],
            '音频': ['audio', 'sound'],
            '转换': ['convert', 'conversion'],
            '压缩': ['compress', 'compression'],
            '合并': ['merge', 'join'],
            '分割': ['split', 'divide'],
            '生成': ['generate', 'create'],
            'pdf': ['document'],
            '二维码': ['qr', 'qrcode'],
            '编码': ['encode', 'encoding'],
            '解码': ['decode', 'decoding'],
            '加密': ['encrypt', 'encryption'],
            '解密': ['decrypt', 'decryption']
        };
        
        // 为标题中的每个词添加同义词
        words.forEach(word => {
            if (synonyms[word]) {
                tags.push(...synonyms[word]);
            }
        });
        
        return [...new Set(tags)]; // 去重
    }
    
    // 提取工具数据
    function extractToolsData() {
        console.log("开始提取工具数据");
        const tools = [];
        
        // 热门工具
        const popularTools = document.querySelectorAll('#popular-tools-container .col-md-4');
        console.log("找到热门工具:", popularTools.length);
        
        popularTools.forEach((tool, index) => {
            const link = tool.querySelector('a');
            const title = tool.querySelector('.card-title')?.textContent?.trim();
            const description = tool.querySelector('.card-text')?.textContent?.trim();
            const icon = tool.querySelector('.tool-icon i')?.className || '';
            
            if (title && link) {
                tools.push({
                    title,
                    url: link.href,
                    description: description || '',
                    icon,
                    category: '热门工具',
                    tags: getTagsFromTitle(title)
                });
                console.log(`热门工具 ${index+1}: ${title}`);
            }
        });
        
        // 分类工具
        const categories = document.querySelectorAll('.tool-category');
        console.log("找到工具分类:", categories.length);
        
        categories.forEach(category => {
            const categoryTitle = category.querySelector('.category-title')?.textContent?.trim();
            console.log(`处理分类: ${categoryTitle}`);
            
            // 获取分类下的所有工具链接
            const toolLinks = category.querySelectorAll('.list-group-item a');
            console.log(`找到分类 "${categoryTitle}" 下的工具:`, toolLinks.length);
            
            toolLinks.forEach(link => {
                if (link && link.textContent) {
                    const title = link.textContent.trim();
                    tools.push({
                        title,
                        url: link.href,
                        description: '',
                        icon: '',
                        category: categoryTitle,
                        tags: getTagsFromTitle(title)
                    });
                }
            });
        });
        
        console.log("工具数据提取完成，共找到工具:", tools.length);
        return tools;
    }
    
    // 执行搜索
    function performSearch(query) {
        console.log("执行搜索，关键词:", query);
        
        if (!query.trim()) {
            hideSearchResults();
            return;
        }
        
        // 保存到搜索历史
        saveSearchHistory(query);
        
        // 确保已提取工具数据
        if (!toolsData || toolsData.length === 0) {
            console.log("工具数据为空，重新提取");
            toolsData = extractToolsData();
        }
        
        console.log("可搜索的工具总数:", toolsData.length);
        
        const results = [];
        const queryTerms = query.toLowerCase().split(/\s+/);
        
        toolsData.forEach(tool => {
            let score = 0;
            const title = (tool.title || '').toLowerCase();
            const description = (tool.description || '').toLowerCase();
            const category = (tool.category || '').toLowerCase();
            
            // 标题匹配权重最高
            queryTerms.forEach(term => {
                if (title.includes(term)) {
                    score += 10;
                }
                
                // 描述匹配
                if (description.includes(term)) {
                    score += 5;
                }
                
                // 标签匹配
                if (tool.tags && tool.tags.some(tag => tag.includes(term))) {
                    score += 8;
                }
                
                // 分类匹配
                if (category.includes(term)) {
                    score += 3;
                }
            });
            
            if (score > 0) {
                results.push({
                    ...tool,
                    score
                });
            }
        });
        
        // 按相关性排序
        results.sort((a, b) => b.score - a.score);
        
        console.log("搜索结果数量:", results.length);
        
        renderSearchResults(results);
    }
    
    // 渲染搜索结果
    function renderSearchResults(results) {
        console.log("渲染搜索结果");
        const resultContent = document.getElementById('searchResultsContent');
        resultContent.innerHTML = '';
        
        if (results.length === 0) {
            searchResultsStatus.innerHTML = `
                <div class="alert alert-info">
                    没有找到与 "<strong>${searchInput.value}</strong>" 相关的工具
                </div>
            `;
            searchResultsStatus.style.display = 'block';
            searchResultsContainer.style.display = 'none';
            
            // 搜索无结果时，根据输入框内容决定是否显示搜索历史
            if (searchInput.value.trim() !== '') {
                showSearchHistory();
            } else {
                hideSearchHistory();
            }
            
            return;
        }
        
        searchResultsStatus.style.display = 'none';
        
        // 隐藏搜索历史区域和其他原始内容，只显示搜索结果
        searchHistorySection.style.display = 'none';
        
        // 隐藏其他原始内容
        document.querySelectorAll('section').forEach(section => {
            if (section.id !== 'searchResults' && section.id !== 'searchHistorySection') {
                section.style.display = 'none';
            }
        });
        
        // 更新搜索结果标题
        document.querySelector('.search-results-title').textContent = 
            `搜索结果: ${results.length} 个工具 "${searchInput.value}"`;
        
        // 显示搜索结果容器
        searchResultsContainer.style.display = 'block';
        
        // 创建结果卡片
        results.forEach((tool, index) => {
            console.log(`渲染搜索结果 ${index+1}: ${tool.title}`);
            
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 mb-4';
            
            // 根据是否有图标决定使用哪种卡片样式
            if (tool.icon) {
                card.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="tool-icon text-center mb-3">
                                <i class="${tool.icon}"></i>
                            </div>
                            <h5 class="card-title">${tool.title}</h5>
                            <p class="card-text">${tool.description}</p>
                            <div class="card-footer mt-3">
                                <small class="text-muted">分类: ${tool.category}</small>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${tool.title}</h5>
                            <p class="card-text">${tool.description || '点击访问该工具'}</p>
                            <div class="card-footer mt-3">
                                <small class="text-muted">分类: ${tool.category}</small>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // 为整个卡片添加点击事件
            card.addEventListener('click', function() {
                console.log(`卡片被点击: ${tool.title}, 跳转至: ${tool.url}`);
                window.location.href = tool.url;
            });
            
            card.style.cursor = 'pointer';
            resultContent.appendChild(card);
        });
        
        // 滚动到搜索结果顶部
        searchResultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 隐藏搜索结果
    function hideSearchResults() {
        console.log("隐藏搜索结果");
        searchResultsContainer.style.display = 'none';
        searchResultsStatus.style.display = 'none';
        
        // 显示原始内容
        document.querySelectorAll('section').forEach(section => {
            if (section.id !== 'searchHistorySection') {
                section.style.display = '';
            }
        });
        
        // 根据输入框内容决定是否显示搜索历史
        if (searchInput.value.trim() !== '' || searchInput.matches(':focus')) {
            showSearchHistory();
        } else {
            hideSearchHistory();
        }
        
        // 滚动回顶部或热门工具部分
        document.getElementById('popular').scrollIntoView({ behavior: 'smooth' });
    }
    
    // 检查URL参数是否有搜索请求
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
        searchInput.value = queryParam;
        performSearch(queryParam);
    }
    
    console.log("搜索模块初始化完成");
}); 