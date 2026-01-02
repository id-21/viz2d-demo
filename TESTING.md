# Local Texture Loading - Manual Test Plan

## Setup Tests
- [ ] Run `pnpm dev` - server starts without errors
- [ ] Navigate to http://localhost:5173
- [ ] Open DevTools Network tab

## Texture Serving Tests
- [ ] Load a .viz2d file
- [ ] Select any texture from grid
- [ ] Click on a segment to apply texture
- [ ] Network tab shows request to `/local-textures/[Collection]/[filename].jpg`
- [ ] Request returns 200 OK with image content
- [ ] Texture applies successfully to segment

## Virtual Scrolling Tests
- [ ] Open DevTools Elements panel
- [ ] Count rendered texture card elements (should be ~30-50, not 963)
- [ ] Scroll through texture list smoothly (60fps)
- [ ] Textures at top/bottom of list render correctly
- [ ] Memory usage in DevTools Performance Monitor < 100MB

## Search Tests
- [ ] Type "Energie" in search box
- [ ] Only Energie textures shown (69 items)
- [ ] Clear search - all 963 textures shown
- [ ] Type gibberish - "No textures found" message
- [ ] Search is case-insensitive ("energie" works)
- [ ] Search by filename works (e.g., "30185")

## Two-Stage Loading Tests
- [ ] Texture grid shows placeholder images immediately
- [ ] Placeholders are low quality 200×200 previews
- [ ] Click segment - full resolution texture loads (check Network tab)
- [ ] Full texture file size > 200KB (confirms not using placeholder)
- [ ] Placeholder images load instantly on scroll

## Error Handling Tests
- [ ] Modify vite.config.ts to break middleware (comment out localTextureMiddleware)
- [ ] Attempt to apply texture
- [ ] Console shows error (no crash)
- [ ] Fix middleware - textures work again

## Collections Coverage
Test one texture from each collection:
- [ ] Energie
- [ ] Thema
- [ ] Forbidden City
- [ ] Berber
- [ ] Thai
- [ ] Tradizioni
- [ ] Victorian
- [ ] CVLTO
- [ ] Purity
- [ ] Lattice
- [ ] Playful Layers
- [ ] Vitalis

## Performance Tests
- [ ] Initial page load < 3s
- [ ] Scrolling maintains 60fps (check DevTools Performance tab)
- [ ] Memory usage stays under 100MB
- [ ] Search response is instant (no lag)
- [ ] Texture application completes in < 2s

## UI/UX Tests
- [ ] Selected texture highlights correctly
- [ ] Hover effects work on texture cards
- [ ] Loading states show correctly
- [ ] Texture preview images display properly
- [ ] Texture names display correctly
- [ ] Settings toggle works for applied textures
- [ ] Can remove applied textures
- [ ] Can adjust texture rotation, scale, offset

## Browser Compatibility Tests
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari (if on macOS)

## Edge Cases
- [ ] Load very large .viz2d file
- [ ] Apply multiple textures to different segments
- [ ] Search with special characters
- [ ] Rapid scrolling through texture list
- [ ] Rapid texture switching

## Success Criteria
✅ All tests pass
✅ No browser crashes or freezes
✅ Smooth scrolling performance
✅ Textures load and apply correctly
✅ Memory usage acceptable
✅ All 963 textures accessible

---

## Notes Section
Use this section to record any issues found during testing:

### Issues Found:
1.
2.
3.

### Performance Observations:
- Initial load time: ___s
- Average scroll FPS: ___
- Peak memory usage: ___MB
- Texture application time: ___s

### Browser-Specific Issues:
- Chrome:
- Firefox:
- Safari:
