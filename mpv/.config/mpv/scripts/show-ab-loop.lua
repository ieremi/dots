local mp = require "mp"

local function show_ab_loop()
    local a = mp.get_property("ab-loop-a")
    local b = mp.get_property("ab-loop-b")

    local text = string.format("A: %s  B: %s", tostring(a), tostring(b))

    print(text)
    mp.osd_message(text, 3)
end

mp.add_key_binding(nil, "show-ab-loop", show_ab_loop)