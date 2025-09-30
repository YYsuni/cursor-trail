;(() => {
	const STORAGE_KEY = 'cursorTrailSettings'
	let enabled = true
	let settings = {
		color: '#75e6a0',
		size: 10,
		count: 12,
		decay: 0.12
	}

	function loadSettings() {
		try {
			chrome.storage?.sync?.get([STORAGE_KEY], res => {
				if (res && res[STORAGE_KEY]) {
					const cfg = res[STORAGE_KEY]
					if (typeof cfg.enabled === 'boolean') enabled = cfg.enabled
					settings = { ...settings, ...cfg }
					applyStyleFromSettings()
				}
			})
		} catch (_) {}
	}

	// Create fullscreen SVG layer
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	svg.setAttribute('data-cursor-trail', '')
	svg.setAttribute('width', '100%')
	svg.setAttribute('height', '100%')
	svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
	svg.style.position = 'fixed'
	svg.style.left = '0'
	svg.style.top = '0'
	svg.style.pointerEvents = 'none'
	svg.style.zIndex = '2147483647'

	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
	path.setAttribute('fill', 'none')
	svg.appendChild(path)
	document.documentElement.appendChild(svg)

	function applyStyleFromSettings() {
		path.setAttribute('stroke', settings.color)
		path.setAttribute('stroke-width', String(settings.size))
		path.setAttribute('stroke-linecap', 'round')
		path.setAttribute('stroke-linejoin', 'round')
		path.setAttribute('opacity', '0.9')
	}

	loadSettings()
	applyStyleFromSettings()

	const updateViewBox = () => {
		svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
	}
	window.addEventListener('resize', updateViewBox, { passive: true })

	let mark = 0
	let points = []

	let rafId = 0
	const schedule = () => {
		if (!rafId) rafId = requestAnimationFrame(step)
	}

	document.addEventListener(
		'mousemove',
		e => {
			points.push({ x: e.clientX, y: e.clientY, life: 1 })
			if (points.length > settings.count) points.shift()
			schedule()
		},
		{ passive: true }
	)

	function buildLinePathD(pts) {
		if (pts.length <= 2) return ''

		// Quadratic Bezier smoothing using midpoints
		const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
		const p0 = pts[0]
		const p1 = pts[1]
		let d = `M ${p0.x} ${p0.y}`

		if (pts.length === 2) {
			return d + ` L ${p1.x} ${p1.y}`
		}

		// Move to first midpoint to start smoothing
		let m01 = midpoint(p0, p1)
		d += ` L ${m01.x} ${m01.y}`

		for (let i = 1; i < pts.length - 1; i++) {
			const curr = pts[i]
			const next = pts[i + 1]
			const mid = midpoint(curr, next)
			// Use current point as control point, and mid as end point
			d += ` Q ${curr.x} ${curr.y} ${mid.x} ${mid.y}`
		}

		// Finally curve to the last point using the penultimate as control
		const penultimate = pts[pts.length - 2]
		const last = pts[pts.length - 1]
		d += ` Q ${penultimate.x} ${penultimate.y} ${last.x} ${last.y}`

		return d
	}

	function simplifyPoints(pts, minDist) {
		if (pts.length <= 2) return pts
		const threshold2 = minDist * minDist
		const out = [pts[0]]
		let last = pts[0]
		for (let i = 1; i < pts.length; i++) {
			const p = pts[i]
			const dx = p.x - last.x
			const dy = p.y - last.y
			if (dx * dx + dy * dy >= threshold2) {
				out.push(p)
				last = p
			}
		}
		return out
	}

	function step() {
		mark++
		rafId = 0
		path.setAttribute('data-mark', mark)

		if (enabled) {
			if (points.length > 0) {
				points.forEach(pt => {
					pt.life -= settings.decay
				})
				points = points.filter(pt => pt.life > 0)
			}

			const minDist = Math.max(1.5, 10)
			const pts = simplifyPoints(points, minDist)
			const d = buildLinePathD(pts)
			path.setAttribute('d', d)

			const alpha = Math.min(1, Math.max(0, pts.length / Math.max(2, settings.count * 0.8)))
			path.setAttribute('opacity', String(0.25 + alpha * 0.65))

			if (points.length > 0) {
				schedule()
			}
		} else {
			path.setAttribute('d', '')
		}
	}

	try {
		chrome.storage?.onChanged?.addListener((changes, area) => {
			if (area !== 'sync' || !changes[STORAGE_KEY]) return
			const next = changes[STORAGE_KEY].newValue || {}
			if (typeof next.enabled === 'boolean') enabled = next.enabled
			settings = { ...settings, ...next }
			applyStyleFromSettings()
			// clip length if count reduced
			if (points.length > settings.count) points = points.slice(points.length - settings.count)
		})
	} catch (_) {}
})()
