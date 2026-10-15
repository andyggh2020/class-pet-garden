import os
from fontTools.ttLib import TTFont

icons = ('add arrow_forward assignment bolt call check chevron_left chevron_right '
         'close content_copy delete edit emoji_events expand_more grid_view group_off '
         'health_and_safety heart_minus lock lock_reset manage_accounts military_tech '
         'menu_book person person_remove pets rate_review refresh remove restart_alt '
         'restaurant save school search search_off share swap_horiz stars task_alt '
         'touch_app trending_up upload verified view_list volunteer_activism '
         'workspace_premium dashboard favorite').split()

path = os.path.join(os.environ['TEMP'], 'msr-final.woff2')
font = TTFont(path)
g2c = {g: chr(cp) for cp, g in font.getBestCmap().items()}

ligs = set()
gsub = font.get('GSUB')
for lookup in gsub.table.LookupList.Lookup:
    for st in lookup.SubTable:
        if lookup.LookupType == 7 and hasattr(st, 'ExtSubTable'):
            st = st.ExtSubTable
        if hasattr(st, 'ligatures'):
            for first, seqs in st.ligatures.items():
                for lig in seqs:
                    seq = [first] + list(lig.Component)
                    ligs.add(''.join(g2c.get(g, '?') for g in seq))

missing = [i for i in icons if i not in ligs]
print('子集连字数:', len(ligs))
print('缺失图标:', missing if missing else '无，48 个全部完整')
