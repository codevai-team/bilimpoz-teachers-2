'use client'

import { useEffect } from 'react'

type Language = 'ru' | 'kg'

export function useCustomTooltips(container?: HTMLElement | null, language: Language = 'ru') {
  useEffect(() => {
    const targetContainer = container || document
    const tooltipElements = targetContainer.querySelectorAll('[data-tooltip]')

    const createTooltip = (element: Element, text: string) => {
      const tooltip = document.createElement('div')
      tooltip.className = 'custom-tooltip'
      tooltip.textContent = text
      tooltip.style.cssText = `
        position: absolute;
        background: var(--bg-card);
        color: var(--text-primary);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        z-index: 9999;
        border: 1px solid var(--border-primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      `
      document.body.appendChild(tooltip)
      return tooltip
    }

    const showTooltip = (element: Element, tooltip: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      tooltip.style.left = `${rect.left + rect.width / 2}px`
      tooltip.style.top = `${rect.top - 8}px`
      tooltip.style.transform = 'translate(-50%, -100%)'
      tooltip.style.opacity = '1'
    }

    const hideTooltip = (tooltip: HTMLElement) => {
      tooltip.style.opacity = '0'
    }

    const tooltips = new Map<Element, HTMLElement>()

    const updateTooltip = (element: Element, tooltip: HTMLElement) => {
      const text = element.getAttribute('data-tooltip')
      if (text) {
        tooltip.textContent = text
      }
    }

    tooltipElements.forEach((element) => {
      const text = element.getAttribute('data-tooltip')
      if (text) {
        const tooltip = createTooltip(element, text)
        tooltips.set(element, tooltip)

        const handleMouseEnter = () => {
          // Обновляем текст tooltip перед показом
          updateTooltip(element, tooltip)
          showTooltip(element, tooltip)
        }

        element.addEventListener('mouseenter', handleMouseEnter)

        element.addEventListener('mouseleave', () => {
          hideTooltip(tooltip)
        })

        // Отслеживаем изменения атрибута data-tooltip
        const observer = new MutationObserver(() => {
          updateTooltip(element, tooltip)
        })
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['data-tooltip']
        })

        // Сохраняем observer для очистки
        ;(element as any).__tooltipObserver = observer
      }
    })

    return () => {
      tooltips.forEach((tooltip, element) => {
        tooltip.remove()
        // Удаляем observer
        const observer = (element as any).__tooltipObserver
        if (observer) {
          observer.disconnect()
          delete (element as any).__tooltipObserver
        }
      })
      tooltips.clear()
    }
  }, [container, language])
}







