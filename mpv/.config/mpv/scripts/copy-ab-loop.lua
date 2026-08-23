local mp = require "mp"

local function copy_ab_loop()
    local a = mp.get_property_number("ab-loop-a")
    local b = mp.get_property_number("ab-loop-b")
    local filename = mp.get_property("filename")

    if not a or not b or not filename then
        mp.osd_message("A-B loop is not set")
        return
    end

    local text = string.format(
        'ffmpeg -ss %g -to %g -i "%s" -c copy output.mp4',
        a,
        b,
        filename
    )

    mp.command_native({
        name = "subprocess",
        args = {"/usr/bin/pbcopy"},
        stdin_data = text,
        playback_only = false,
    })

    mp.osd_message(text, 4)
end

mp.add_key_binding(nil, "copy-ab-loop", copy_ab_loop)