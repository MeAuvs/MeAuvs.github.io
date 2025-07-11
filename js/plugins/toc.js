// 文章目录功能
(function() {
  'use strict';
  
  // 自动生成目录
  function generateTOC() {
    const tocList = document.querySelector('.toc-list');
    if (!tocList) return;
    
    // 清空现有目录
    tocList.innerHTML = '';
    
    // 获取文章内容区域
    const articleContent = document.querySelector('article.md-text.content, article.content, .article-content, .post-content, .entry-content, article');
    if (!articleContent) return;
    
    // 查找所有 h1, h2, h3 标题，以及特殊格式的标题
    let headings = articleContent.querySelectorAll('h1, h2, h3');
    
    // 如果没有找到标准标题，尝试查找特殊格式的标题
    if (headings.length === 0) {
      // 查找所有文本节点，寻找可能的标题格式
      const textNodes = [];
      const walker = document.createTreeWalker(
        articleContent,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        // 检查是否是可能的标题（中文或英文，长度适中）
        if (text.length > 3 && text.length < 50 && 
            /^[A-Za-z\u4e00-\u9fa5]/.test(text) &&
            !text.includes('```') && 
            !text.includes('---') &&
            !text.includes('title:') &&
            !text.includes('date:') &&
            !text.includes('tags:') &&
            !text.includes('cover:') &&
            !text.includes('banner:')) {
          
          // 检查这个文本节点是否在段落中，且段落内容较短（可能是标题）
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'P' || parent.tagName === 'DIV')) {
            const parentText = parent.textContent.trim();
            if (parentText === text && parentText.length < 50) {
              textNodes.push({
                element: parent,
                text: text
              });
            }
          }
        }
      }
      
      // 如果找到了可能的标题，使用它们
      if (textNodes.length > 0) {
        headings = textNodes.map(item => item.element);
      }
    }
    
    if (headings.length === 0) {
      // 如果没有找到标题，隐藏整个目录
      const articleToc = document.getElementById('article-toc');
      if (articleToc) {
        articleToc.style.display = 'none';
      }
      return;
    }
    
    // 为每个标题生成目录项
    headings.forEach((heading, index) => {
      // 为标题添加ID（如果还没有的话）
      if (!heading.id) {
        const text = heading.textContent.trim();
        const id = text.toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '');
        heading.id = id || `heading-${index}`;
      }
      
      // 创建目录项
      const tocItem = document.createElement('li');
      // 对于特殊格式的标题，统一使用 toc-level-2
      const level = heading.tagName && heading.tagName.match(/^H[1-6]$/) 
        ? heading.tagName.charAt(1) 
        : '2';
      tocItem.className = `toc-item toc-level-${level}`;
      
      const tocLink = document.createElement('a');
      tocLink.href = `#${heading.id}`;
      tocLink.className = 'toc-link';
      tocLink.textContent = heading.textContent.trim();
      
      tocItem.appendChild(tocLink);
      tocList.appendChild(tocItem);
    });
  }
  
  // 目录切换功能
  window.toggleTOC = function() {
    const tocContent = document.querySelector('.toc-content');
    const toggleBtn = document.querySelector('.toc-toggle');
    
    if (tocContent && toggleBtn) {
      tocContent.classList.toggle('collapsed');
      toggleBtn.classList.toggle('collapsed');
      
      // 保存状态到localStorage
      const isCollapsed = tocContent.classList.contains('collapsed');
      localStorage.setItem('toc-collapsed', isCollapsed);
    }
  };
  
  // 滚动监听和高亮当前章节
  function initTOCScroll() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (tocLinks.length === 0 || headings.length === 0) {
      return;
    }
    
    // 为标题添加ID
    headings.forEach((heading, index) => {
      if (!heading.id) {
        const text = heading.textContent.trim();
        const id = text.toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '');
        heading.id = id || `heading-${index}`;
      }
    });
    
    // 滚动监听
    function updateActiveTOC() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      let activeHeading = null;
      let minDistance = Infinity;
      
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top);
        
        if (rect.top <= 100 && distance < minDistance) {
          minDistance = distance;
          activeHeading = heading;
        }
      });
      
      // 移除所有active类
      tocLinks.forEach(link => link.classList.remove('active'));
      
      // 添加active类到当前章节
      if (activeHeading) {
        const activeLink = document.querySelector(`.toc-link[href="#${activeHeading.id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
          
          // 滚动到可见区域
          const tocContent = document.querySelector('.toc-content');
          if (tocContent && !tocContent.classList.contains('collapsed')) {
            const linkRect = activeLink.getBoundingClientRect();
            const contentRect = tocContent.getBoundingClientRect();
            
            if (linkRect.top < contentRect.top || linkRect.bottom > contentRect.bottom) {
              activeLink.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }
        }
      }
    }
    
    // 平滑滚动到目标位置
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerHeight = 60; // 假设头部高度
          const targetPosition = targetElement.offsetTop - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
    
    // 节流函数
    function throttle(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    // 添加滚动监听
    window.addEventListener('scroll', throttle(updateActiveTOC, 100));
    
    // 初始化时执行一次
    updateActiveTOC();
  }
  
  // 恢复目录状态
  function restoreTOCState() {
    const isCollapsed = localStorage.getItem('toc-collapsed') === 'true';
    const tocContent = document.querySelector('.toc-content');
    const toggleBtn = document.querySelector('.toc-toggle');
    
    if (isCollapsed && tocContent && toggleBtn) {
      tocContent.classList.add('collapsed');
      toggleBtn.classList.add('collapsed');
    }
  }
  
  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 首先生成目录
    generateTOC();
    
    // 然后初始化其他功能
    restoreTOCState();
    initTOCScroll();
  });
  
})(); 