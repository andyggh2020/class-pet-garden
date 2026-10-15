"""将 Material Symbols Rounded 字体裁剪为只含项目使用的图标。

流程：
1. 构建 glyph 名 -> 字符 的映射（基于 cmap）
2. 从 GSUB 的 rlig lookup 中，把连字序列解码成字符串，只保留目标 48 个图标的规则
3. 用 fontTools Subsetter 做子集（closure 只会命中保留的规则）
4. 输出 woff2
"""
import os
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public', 'fonts', 'material-symbols-rounded.woff2')
OUT = os.path.join(os.environ['TEMP'], 'msr-final.woff2')

icons = ('add arrow_forward assignment bolt call check chevron_left chevron_right '
         'close content_copy delete edit emoji_events expand_more grid_view group_off '
         'health_and_safety heart_minus lock lock_reset manage_accounts military_tech '
         'menu_book person person_remove pets rate_review refresh remove restart_alt '
         'restaurant save school search search_off share swap_horiz stars task_alt '
         'touch_app trending_up upload verified view_list volunteer_activism '
         'workspace_premium dashboard favorite').split()
icon_set = set(icons)

font = TTFont(SRC)
cmap = font.getBestCmap()
g2c = {g: chr(cp) for cp, g in cmap.items()}

def decode(seq):
    return ''.join(g2c.get(g, '') for g in seq)

gsub = font['GSUB'].table
kept_rules = 0
seen = set()
for lookup in gsub.LookupList.Lookup:
    for st in lookup.SubTable:
        if lookup.LookupType == 7 and hasattr(st, 'ExtSubTable'):
            st = st.ExtSubTable
        if not hasattr(st, 'ligatures'):
            continue
        for first in list(st.ligatures.keys()):
            kept = []
            for lig in st.ligatures[first]:
                seq = [first] + list(lig.Component)
                s = decode(seq)
                if s in icon_set and s not in seen:
                    kept.append(lig)
                    kept_rules += 1
                    seen.add(s)
            if kept:
                st.ligatures[first] = kept
            else:
                del st.ligatures[first]

missing = icon_set - seen
print('保留的连字规则数:', kept_rules, '/ 目标图标', len(icon_set))
print('未能找到连字规则的图标:', sorted(missing) if missing else '无')

options = subset.Options()
options.layout_features = ['rlig']
options.flavor = 'woff2'
ss = subset.Subsetter(options)
chars = {ord(c) for name in icon_set for c in name}
ss.populate(unicodes=chars)
ss.subset(font)

font.save(OUT)
print('输出:', OUT)
print('大小: %.1f KB' % (os.path.getsize(OUT) / 1024))
