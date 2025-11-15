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
        background: #151515;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        z-index: 9999;
        border: 1px solid #404040;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
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

    tooltipElements.forEach((element) => {
      const text = element.getAttribute('data-tooltip')
      if (text) {
        const tooltip = createTooltip(element, text)
        tooltips.set(element, tooltip)

        element.addEventListener('mouseenter', () => {
          showTooltip(element, tooltip)
        })

        element.addEventListener('mouseleave', () => {
          hideTooltip(tooltip)
        })
      }
    })

    return () => {
      tooltips.forEach((tooltip) => {
        tooltip.remove()
      })
      tooltips.clear()
    }
  }, [container, language])
}




