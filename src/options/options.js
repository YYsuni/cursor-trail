const STORAGE_KEY = 'cursorTrailSettings'

function load(cb) {
	try {
		chrome.storage.sync.get([STORAGE_KEY], res => cb(res?.[STORAGE_KEY] || {}))
	} catch (_) {
		cb({})
	}
}
function save(next, cb) {
	try {
		chrome.storage.sync.set({ [STORAGE_KEY]: next }, cb)
	} catch (_) {
		cb && cb()
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const color = document.getElementById('color')
	const size = document.getElementById('size')
	const count = document.getElementById('count')
	const decay = document.getElementById('decay')
	const saveBtn = document.getElementById('save')
	const status = document.getElementById('status')

	load(cfg => {
		color.value = cfg.color || '#75e6a0'
		size.value = Number.isFinite(cfg.size) ? cfg.size : 10
		count.value = Number.isFinite(cfg.count) ? cfg.count : 12
		decay.value = Number.isFinite(cfg.decay) ? cfg.decay : 0.12
	})

	saveBtn.addEventListener('click', () => {
		const next = {
			enabled: true,
			color: color.value,
			size: Math.max(2, Math.min(40, Number(size.value) || 10)),
			count: Math.max(4, Math.min(48, Number(count.value) || 12)),
			decay: Math.max(0.02, Math.min(0.4, Number(decay.value) || 0.12))
		}
		save(next, () => {
			status.textContent = 'Saved'
			setTimeout(() => (status.textContent = ''), 1200)
		})
	})
})
