local mp = require "mp"

local function set_window_4()
    local a = mp.get_property_number("ab-loop-a")

    if a then
        mp.set_property_number("ab-loop-b", a + 4)
    end
end

mp.add_key_binding(nil, "set-window-4", set_window_4)