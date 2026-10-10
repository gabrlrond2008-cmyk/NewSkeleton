export default {
    features: [
        {
            area: 'Code Editor (Blocks)',
            items: [
                'Blocks are organized by categories, each with its own color: Motion (dark blue), Looks (purple), Sound (pink), Control (orange), Events (yellow), Sensing (light blue), Pen (dark green), Operators (light green), Variables (dark orange), and My Blocks (red).',
                'To program: drag blocks from the palette on the left to the central workspace. They snap together like puzzle pieces.',
                'Right-click any block to see options: duplicate, delete, add a comment, collapse to save space, or get help.',
                'Use the mouse wheel to zoom in and out, or the zoom buttons (+/-) on the right edge of the blocks area.',
                'The green flag above the stage starts all blocks that begin with "when green flag clicked". The red button next to it stops them all.',
                'You can also click directly on a block to run it individually, great for testing things out.',
                'With "Make a Block" in the My Blocks category you can create your own custom blocks, reusable and with parameters.',
                'Each sprite has its own blocks and scripts, independent from others.',
                'If you drag a block outside the workspace or onto the trash bin that appears at the bottom right, you delete it.',
                'Control blocks have structures like "forever", "repeat", "if... then... else", "wait", "create clone", etc.',
                'Sensing blocks detect the world: touching colors, distance, ask and wait, timer, mouse position, microphone volume.',
                'Operator blocks let you do math: add, subtract, multiply, divide, random numbers, compare, join text, letters of words.',
                'Variables store data: you can create variables, change them, show them on the stage as monitors, and use them in your blocks.',
                'Lists are like variables but with many values; you can add, delete, insert, and replace items in a list.',
                'Events trigger scripts: "when green flag clicked", "when key pressed", "when this sprite clicked", "when I receive message", "when volume >".',
                'Motion controls the position, direction, rotation, sliding, and bouncing of sprites on the stage.'
            ]
        },
        {
            area: 'Costumes & Backdrops Editor',
            items: [
                'The "Costumes" tab (second tab) shows all costumes of the selected sprite. If you select the stage, it becomes "Backdrops".',
                'To add a new costume use the buttons at the bottom left: choose from the Library (ready-made drawings), Paint (open the editor), or Upload file (from your computer).',
                'The paint editor has two modes: vector (drawings made with shapes that can be separated) and bitmap (pixel drawing, like painting with squares).',
                'Editor tools: brush (free drawing), line (straight lines), rectangle, circle, text (for writing), paint bucket (fill areas), and selection (grab parts).',
                'Each tool has variants: click the small triangle at the button\'s corner to see more options (calligraphy brush, dotted lines, etc.).',
                'You can change fill and outline colors from the color squares above the editor. There is also a color picker with eyedropper.',
                'For a costume to look good at different sizes, work in vector mode; for pixel effects, use bitmap.',
                'The order of costumes in the list matters: the first one is the default. Drag them to reorder.',
                'With the buttons above the list you can duplicate, delete, or switch to vector/bitmap the selected costume.',
                'There are transformation tools: rotate, skew, scale, and flip/mirror.'
            ]
        },
        {
            area: 'Sound Editor',
            items: [
                'The "Sounds" tab (third tab) shows all the sounds in your project.',
                'To add sounds: Library (pre-recorded sounds), Record (use the microphone), or Upload file (MP3, WAV, etc.).',
                'The editor shows the sound waveform: the high parts are the loud sounds and the low parts are the quiet ones.',
                'With the mouse you can select a portion of the waveform to work with just that piece (trim, delete, apply effects).',
                'Quick effects: robot (metallic voice), reverse (backwards), silence (removes sound), slower, faster.',
                'You can change the overall volume and make the sound fade in/out gradually.',
                'To rename a sound, click on its name in the list on the left.',
                'With Sound blocks you can play sounds, change their volume, and modify the tempo.'
            ]
        },
        {
            area: 'AI Assistant',
            items: [
                'The AI tab is the fourth tab in the editor. It\'s like having an assistant by your side.',
                'It\'s a chat where you can ask how to do things in Scratch: how a block works, what a tool is for, how to fix something.',
                'The AI can read your blocks, create new blocks, and modify your project based on your requests.',
                'To use it you need to configure an API Key in Settings > AI. Choose a provider and enter your key.',
                'Each response has a "Verify" button that checks if what it said is correct, using the app\'s information.',
                'The assistant uses special formatting for responses: headings, bullet lists, code, tables, bold and italic.',
                'It can read the blocks in your workspace and create new blocks for you. It gives instructions and can help you build projects.',
                'If it asks you to do something other than questions about the app, tell it it cannot. If it doesn\'t know something, it says so.',
                'If you need to change provider or model, everything is configured from Settings > AI and saves automatically.'
            ]
        },
        {
            area: 'Split Pane View',
            items: [
                'The split view lets you see two tabs at the same time, like having two windows in one.',
                'Activate it by dragging a tab to either side of the editor, or with right-click > "Split screen ▸".',
                'The screen splits into two halves with a divider bar that you can drag.',
                'The divider bar has snap points at 33%, 50% and 66% for quick space distribution.',
                'Use the ↔ button in the secondary panel to swap the panels.',
                'To exit split view: click the non-divided tab, the ✕ button in the panel, or right-click > "Close split view".',
                'It\'s very useful for example to see code while drawing a costume, or having AI open while programming.',
                'When you exit split view, everything returns to normal and your things stay as they were.'
            ]
        },
        {
            area: 'Projects',
            items: [
                'Create new project: File Menu > New, or shortcut Ctrl+Shift+N (Cmd+Shift+N on Mac).',
                'Save: Ctrl+S (Cmd+S on Mac) saves the project. If you configured a default folder, it saves there automatically without asking.',
                'Save to your computer: File Menu > Save to computer. Downloads a .flynt file with your entire project.',
                'Load project: File Menu > Load from computer. Choose a .flynt or .sb3 file and it opens.',
                'The project title is edited directly: click on the name at the top and type the new one.',
                'If there are unsaved changes, the app warns you with a dot or a message. Your work won\'t get lost without notice.',
                '.flynt files are like a box that contains everything: code, costumes, sounds, AI data, and device settings all together.',
                'In the desktop version (the one installed on your computer), you can choose a folder in Settings > Default save path and projects save there automatically.'
            ]
        },
        {
            area: 'Time Travel Modes',
            items: [
                'The Mode menu in the top bar lets you change the visual style of the entire editor.',
                'There are 5 modes:',
                '- Normal: the default look with standard Scratch colors.',
                '- Caturday (2020): all blocks transform into cat shapes with fun colors and styles.',
                '- Nineties (1990): applies a green hue shift and shows geometric shapes overlay.',
                '- Old Timey (1920): applies a sepia vintage filter, an old film projection overlay, and plays projector audio.',
                '- Prehistoric (220022 BC): shows a cave background with a torch that follows your mouse cursor, with a shaking effect.',
                'To activate: go to the Mode menu in the top bar and select the mode you want.',
                'To return to normal: choose Normal mode from the same menu.',
                'All time travel modes are only visual changes. Your projects work exactly the same.'
            ]
        },
        {
            area: 'Themes / Color Mode',
            items: [
                'To change the interface color: go to Settings > Color Mode.',
                'Three themes exist: Default (the classic Scratch colors), High Contrast (stronger colors for readability), and Dark (darker interface colors). Only Default and High Contrast are shown in the menu.',
                'High Contrast is good if you have trouble seeing light colors or if you work in bright light.',
                'The theme you choose saves automatically; next time you open the app, it remembers.',
                'If your computer or phone has high contrast mode enabled, the app detects it and applies it automatically.',
                'The checkmark next to each option shows you which one is active.',
                'The Caturday option also lives here, below the other two.'
            ]
        },
        {
            area: 'Language',
            items: [
                'To change the interface language: Settings > Language.',
                'A list opens with available languages.',
                'Simply click the one you want and the interface changes instantly.',
                'Available languages: English and Spanish.',
                'Languages like Arabic or Hebrew are written right-to-left (RTL). The interface adapts automatically, menus go to the other side.',
                'A checkmark shows your current language.'
            ]
        },
        {
            area: 'Stage',
            items: [
                'The stage is at the top right and is where things happen: sprites move, talk, interact.',
                'To view it in full screen click the squares button in the top right corner of the stage.',
                'You can enlarge and shrink it with the expand/collapse button next to the full screen button.',
                'Coordinates: the center of the stage is (0, 0). To the left X goes down to -240, to the right up to 240. Y goes from -180 at bottom to 180 at top.',
                'If you show a variable, it appears as a bubble on the stage. You can drag it anywhere.',
                'Right-click that bubble to change how it looks: just numbers, large display, or a slider to change it.',
                'The green flag starts scripts that begin with "when green flag clicked". The red button stops them.',
                'The stage is also a special object (called Stage). It doesn\'t move, but it can have its own code, backdrops and sounds.'
            ]
        },
        {
            area: 'Sprites',
            items: [
                'The sprite list is below the stage. There you see all the sprites in your project.',
                'Each sprite is independent: it has its own name, costumes, sounds and code.',
                'To add a sprite: click the happy face button below the stage. You can choose from the Library, Paint one, Upload a file, or a Surprise one.',
                'To duplicate a sprite: right-click > duplicate, or shortcut Ctrl+D (Cmd+D on Mac).',
                'To delete: right-click > delete, or select it and press Del/Delete on the keyboard.',
                'If you deleted it by accident, a "Restore" button appears at the top right to recover it.',
                'Sprite properties (name, X/Y position, size, direction) are changed in the panel above the stage.',
                'Each sprite can have multiple costumes; the first one in the list is the one shown.',
                'The eye icon next to each sprite in the list shows or hides it from the stage.',
                'The stage also appears in the sprite list but it\'s special: it doesn\'t move and doesn\'t have costumes (it has backdrops).'
            ]
        },
        {
            area: 'Extensions and Devices',
            items: [
                'Extensions add new blocks with special functions.',
                'To add one: click the "+" button at the bottom left of the blocks area.',
                'Built-in extensions: Music (play instruments and notes), Pen (draw on the stage), Text to Speech (talk), Translate, Video Sensing (detect motion with camera), LEGO WeDo 2.0, and Go Direct Force & Acceleration.',
                'There are also extensions to connect with real devices: micro:bit (programmable board), LEGO (Boost, EV3, Mindstorms), Makey Makey, and more.',
                'When you add an extension, its new blocks appear in the palette with their own color.',
                'To connect a physical device, follow the steps shown by the app. Some need Bluetooth or a USB cable.',
                'The device selector in the top bar shows which one is connected and lets you change it.',
                'Hardware extensions are ideal for real-world interactive projects.'
            ]
        },
        {
            area: 'Supported Devices',
            items: [
                'The app supports 20 programmable devices for electronics projects:',
                '- Arduino Uno, Arduino Nano, Arduino Leonardo, Arduino Mega 2560',
                '- Arduino Uno R4 Minima, Arduino Uno R4 WiFi',
                '- STBoard Extension, STBoard V2',
                '- ESP32, ESP32-S3, NodeMCU (ESP8266)',
                '- MaixDock (K210), Maixduino (K210)',
                '- Raspberry Pi Pico, Pico W, Pico 2, Pico 2 W',
                '- Micro:bit, Micro:bit V2',
                'The device selector in the top bar shows the connected device.',
                'Electronics tabs (Control, Circuits, 3D) use these devices.'
            ]
        },
        {
            area: 'Turbo Mode',
            items: [
                'Turbo mode speeds up projects to the max, like giving them a strong coffee.',
                'It activates with a button or indicator that says "turbo" somewhere in the interface.',
                'It\'s for heavy projects: many clones, long math calculations, loops that never end.',
                'It doesn\'t make sprites move faster on the stage (that\'s done with motion blocks), but processes them faster.',
                'With turbo, "forever" and "repeat" loops run without pause between iterations.',
                'To deactivate it, click the same button again.'
            ]
        },
        {
            area: 'Desktop Saving (Tauri)',
            items: [
                'If you installed Scratch on your computer (not in the browser), you can save projects much more conveniently.',
                'To configure: Settings > Default save path, toggle the switch and choose a folder.',
                'With a folder chosen, every time you press Ctrl+S it saves automatically without asking anything.',
                'If you didn\'t choose a folder, Ctrl+S opens the window to choose where to save.',
                'The file saves as .flynt with the project name.'
            ]
        },
        {
            area: 'AI Settings (Settings > AI)',
            items: [
                'Settings > AI opens the intelligent assistant configuration. It is located inside the Settings menu (not a top-level menu).',
                'First you choose a Provider: Groq, OpenAI, OpenRouter, Gemini or OpenCode Zen.',
                'Each provider needs an API Key. The help text inside the field shows what each key starts with.',
                'Then you choose the Model: available models load automatically when you enter the key.',
                'Free models appear at the top, separated from paid ones. So you know which ones cost nothing.',
                'If models don\'t load (for example, if there\'s no internet), it uses a fallback list.',
                'Groq: fast and all its models are free. Key starts with gsk_... Models: Llama 3.3 70B, Llama 3.1 8B, Qwen 2.5 Coder 32B, DeepSeek R1.',
                'SambaNova Cloud: ultra-fast inference powered by SN40L RDUs (up to 1000 tokens/sec). Key starts with sn-... Models: Llama 3.3 70B, DeepSeek R1, Qwen 2.5 Coder 32B, Llama 3.1 405B.',
                'NVIDIA NIM: free accelerated models with build.nvidia.com credits. Key starts with nvapi-... Models: Llama 3.3 70B, DeepSeek R1, Nemotron 70B, Qwen 2.5 Coder 32B.',
                'OpenAI: the creator of ChatGPT. Key starts with sk-... Models: GPT-4o, GPT-4o Mini, o3 Mini.',
                'OpenRouter: lets you use many models with one key. Key: sk-or-... Models: Claude 3.7 Sonnet, Gemini 2.5 Flash, Llama 3.3, DeepSeek R1.',
                'Gemini: from Google. Key starts with AIza... Models: Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 2.0 Flash.',
                'OpenCode Zen: the OpenCode provider. Key obtained at opencode.ai/auth, starts with oc_... Pay-as-you-go, add balance. Free models: DeepSeek V4 Flash Free, Big Pickle, etc. Paid models: DeepSeek V4 Flash, GPT 5.4 Mini, Claude Sonnet 4.6, Gemini 3 Flash, and more.',
                'Everything saves automatically. Next time you open the app, it\'s already configured.'
            ]
        }
    ],
    tabs: [
        {label: 'Code', description: 'Block editor. Drag blocks from the palette to the workspace to program your project. Categories have identifying colors.'},
        {label: 'Costumes / Backdrops', description: 'Image editor to create and edit sprite costumes or stage backdrops. Includes vector and bitmap drawing tools.'},
        {label: 'Sounds', description: 'Audio editor to record, import, trim and apply effects to the project\'s sounds.'},
        {label: 'AI', description: 'AI chat assistant to ask questions about how to use the app. Requires an API Key configured in Settings > AI.'},
        {label: 'Control', description: 'Control tab for programming connected devices with block-based logic.'},
        {label: 'Circuits', description: 'Circuits tab for designing and simulating electronic circuits.'},
        {label: '3D', description: '3D modeling and visualization tab for creating three-dimensional objects.'}
    ],
    menus: {
        file: 'File Menu: New (create project), Save to computer (download .flynt), Load from computer (upload .flynt or .sb3). Shortcut Ctrl+S for quick save.',
        settings: 'Settings Menu: Language (change language), Color Mode (Default, High Contrast or Dark themes, plus Caturday option), AI (choose provider, enter API Key, select model, toggle mentor mode), Default save path (desktop only: auto-save folder). AI configuration is a submenu inside Settings.',
        mode: 'Mode Menu: Normal mode (standard look), Caturday mode (cat blocks), Nineties mode (green hue), Old Timey mode (sepia vintage), Prehistoric mode (cave with torch). Changes the entire editor visual style.',
        about: 'Version information and application credits. Can be a simple button or a menu with multiple items.',
        device: 'Device Selector: shows the currently connected device (Arduino, ESP32, Raspberry Pi Pico, Micro:bit, etc.) and lets you change it. Only visible when an electronics tab is active.'
    },
    aiSettings: {
        providers: {
            groq: 'Groq: fast, all models are free. API Key starts with "gsk_".',
            sambanova: 'SambaNova Cloud: ultra-fast SN40L RDU inference. API Key starts with "sn-". Includes Llama 3.3 70B, DeepSeek R1, Qwen 2.5 Coder 32B, Llama 3.1 405B.',
            nvidia: 'NVIDIA NIM: free accelerated models with build.nvidia.com credits. API Key starts with "nvapi-". Includes Llama 3.3 70B, DeepSeek R1, Nemotron 70B, Qwen 2.5 Coder.',
            openai: 'OpenAI (ChatGPT). API Key starts with "sk-". Models: GPT-4o (paid), GPT-4o Mini (free).',
            gemini: 'Gemini (Google). API Key starts with "AIza". Free models: Gemini 2.0 Flash, 2.0 Flash Lite, 1.5 Flash.',
            openrouter: 'OpenRouter: access to many models. API Key starts with "sk-or-". Includes Claude, GPT-4o, Gemini.',
            opencodezen: 'OpenCode Zen: OpenCode provider. API Key from opencode.ai/auth, starts with "oc_". Pay-as-you-go, some free models (DeepSeek V4 Flash Free, Big Pickle). Paid models: DeepSeek V4 Flash, GPT 5.4 Mini, Claude Sonnet 4.6, Gemini 3 Flash.'
        }
    },
    blocks: {
        // Shape types: hat, stack, c, cap, reporter, boolean, end
        // Input types: value, statement
        // Shadow defaults: math_number, text, colour_picker, event_broadcast_menu, motion_goto_menu, etc.
        motion: [
            {opcode: 'motion_movesteps', shape: 'stack', category: 'motion',
                inputs: [{name: 'STEPS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_turnright', shape: 'stack', category: 'motion',
                inputs: [{name: 'DEGREES', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_turnleft', shape: 'stack', category: 'motion',
                inputs: [{name: 'DEGREES', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_goto', shape: 'stack', category: 'motion',
                inputs: [{name: 'TO', type: 'value', shadow: 'motion_goto_menu'}]},
            {opcode: 'motion_gotoxy', shape: 'stack', category: 'motion',
                inputs: [{name: 'X', type: 'value', shadow: 'math_number'}, {name: 'Y', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_glideto', shape: 'stack', category: 'motion',
                inputs: [{name: 'SECS', type: 'value', shadow: 'math_number'}, {name: 'TO', type: 'value', shadow: 'motion_glideto_menu'}]},
            {opcode: 'motion_glidesecstoxy', shape: 'stack', category: 'motion',
                inputs: [{name: 'SECS', type: 'value', shadow: 'math_number'}, {name: 'X', type: 'value', shadow: 'math_number'}, {name: 'Y', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_pointindirection', shape: 'stack', category: 'motion',
                inputs: [{name: 'DIRECTION', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_pointtowards', shape: 'stack', category: 'motion',
                inputs: [{name: 'TOWARDS', type: 'value', shadow: 'motion_pointtowards_menu'}]},
            {opcode: 'motion_changexby', shape: 'stack', category: 'motion',
                inputs: [{name: 'DX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_setx', shape: 'stack', category: 'motion',
                inputs: [{name: 'X', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_changeyby', shape: 'stack', category: 'motion',
                inputs: [{name: 'DY', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_sety', shape: 'stack', category: 'motion',
                inputs: [{name: 'Y', type: 'value', shadow: 'math_number'}]},
            {opcode: 'motion_ifonedgebounce', shape: 'stack', category: 'motion'},
            {opcode: 'motion_setrotationstyle', shape: 'stack', category: 'motion'},
            {opcode: 'motion_xposition', shape: 'reporter', category: 'motion'},
            {opcode: 'motion_yposition', shape: 'reporter', category: 'motion'},
            {opcode: 'motion_direction', shape: 'reporter', category: 'motion'}
        ],
        looks: [
            {opcode: 'looks_sayforsecs', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}, {name: 'SECS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_say', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}]},
            {opcode: 'looks_thinkforsecs', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}, {name: 'SECS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_think', shape: 'stack', category: 'looks',
                inputs: [{name: 'MESSAGE', type: 'value', shadow: 'text'}]},
            {opcode: 'looks_switchcostumeto', shape: 'stack', category: 'looks',
                inputs: [{name: 'COSTUME', type: 'value', shadow: 'looks_costume'}]},
            {opcode: 'looks_nextcostume', shape: 'stack', category: 'looks'},
            {opcode: 'looks_switchbackdropto', shape: 'stack', category: 'looks',
                inputs: [{name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops'}]},
            {opcode: 'looks_switchbackdroptoandwait', shape: 'stack', category: 'looks',
                inputs: [{name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops'}]},
            {opcode: 'looks_nextbackdrop', shape: 'stack', category: 'looks'},
            {opcode: 'looks_changesizeby', shape: 'stack', category: 'looks',
                inputs: [{name: 'CHANGE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_setsizeto', shape: 'stack', category: 'looks',
                inputs: [{name: 'SIZE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_changeeffectby', shape: 'stack', category: 'looks',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'CHANGE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_seteffectto', shape: 'stack', category: 'looks',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_cleargraphiceffects', shape: 'stack', category: 'looks'},
            {opcode: 'looks_show', shape: 'stack', category: 'looks'},
            {opcode: 'looks_hide', shape: 'stack', category: 'looks'},
            {opcode: 'looks_gotofrontback', shape: 'stack', category: 'looks'},
            {opcode: 'looks_goforwardbackwardlayers', shape: 'stack', category: 'looks',
                inputs: [{name: 'NUM', type: 'value', shadow: 'math_number'}]},
            {opcode: 'looks_costumenumbername', shape: 'reporter', category: 'looks'},
            {opcode: 'looks_backdropnumbername', shape: 'reporter', category: 'looks'},
            {opcode: 'looks_size', shape: 'reporter', category: 'looks'}
        ],
        sound: [
            {opcode: 'sound_playuntildone', shape: 'stack', category: 'sound',
                inputs: [{name: 'SOUND_MENU', type: 'value', shadow: 'sound_sounds_menu'}]},
            {opcode: 'sound_play', shape: 'stack', category: 'sound',
                inputs: [{name: 'SOUND_MENU', type: 'value', shadow: 'sound_sounds_menu'}]},
            {opcode: 'sound_stopallsounds', shape: 'stack', category: 'sound'},
            {opcode: 'sound_changeeffectby', shape: 'stack', category: 'sound',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_seteffectto', shape: 'stack', category: 'sound',
                inputs: [{name: 'EFFECT', type: 'value', shadow: 'text'}, {name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_cleareffects', shape: 'stack', category: 'sound'},
            {opcode: 'sound_changevolumeby', shape: 'stack', category: 'sound',
                inputs: [{name: 'VOLUME', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_setvolumeto', shape: 'stack', category: 'sound',
                inputs: [{name: 'VOLUME', type: 'value', shadow: 'math_number'}]},
            {opcode: 'sound_volume', shape: 'reporter', category: 'sound'}
        ],
        events: [
            {opcode: 'event_whenflagclicked', shape: 'hat', category: 'events'},
            {opcode: 'event_whenkeypressed', shape: 'hat', category: 'events',
                fields: [{name: 'KEY_OPTION', type: 'dropdown', options: 'sensing_keyoptions'}]},
            {opcode: 'event_whenstageclicked', shape: 'hat', category: 'events'},
            {opcode: 'event_whenthisspriteclicked', shape: 'hat', category: 'events'},
            {opcode: 'event_whenbackdropswitchesto', shape: 'hat', category: 'events',
                inputs: [{name: 'BACKDROP', type: 'value', shadow: 'looks_backdrops'}]},
            {opcode: 'event_whengreaterthan', shape: 'hat', category: 'events',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'event_whenbroadcastreceived', shape: 'hat', category: 'events',
                fields: [{name: 'CHOICE', type: 'dropdown', options: 'event_broadcast_menu'}]},
            {opcode: 'event_broadcast', shape: 'stack', category: 'events',
                inputs: [{name: 'BROADCAST_INPUT', type: 'value', shadow: 'event_broadcast_menu'}]},
            {opcode: 'event_broadcastandwait', shape: 'stack', category: 'events',
                inputs: [{name: 'BROADCAST_INPUT', type: 'value', shadow: 'event_broadcast_menu'}]}
        ],
        control: [
            {opcode: 'control_wait', shape: 'stack', category: 'control',
                inputs: [{name: 'DURATION', type: 'value', shadow: 'math_number'}]},
            {opcode: 'control_repeat', shape: 'c', category: 'control',
                inputs: [{name: 'TIMES', type: 'value', shadow: 'math_number'}, {name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_forever', shape: 'c', category: 'control',
                inputs: [{name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_if', shape: 'c', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}, {name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_if_else', shape: 'c', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}, {name: 'SUBSTACK', type: 'statement'}, {name: 'SUBSTACK2', type: 'statement'}]},
            {opcode: 'control_wait_until', shape: 'stack', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}]},
            {opcode: 'control_repeat_until', shape: 'c', category: 'control',
                inputs: [{name: 'CONDITION', type: 'value', shadow: 'boolean'}, {name: 'SUBSTACK', type: 'statement'}]},
            {opcode: 'control_stop', shape: 'end', category: 'control'},
            {opcode: 'control_create_clone_of', shape: 'stack', category: 'control',
                inputs: [{name: 'CLONE_OPTION', type: 'value', shadow: 'control_create_clone_of_menu'}]},
            {opcode: 'control_start_as_clone', shape: 'hat', category: 'control'},
            {opcode: 'control_delete_this_clone', shape: 'end', category: 'control'}
        ],
        sensing: [
            {opcode: 'sensing_touchingobject', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'TOUCHINGOBJECTMENU', type: 'value', shadow: 'sensing_touchingobjectmenu'}]},
            {opcode: 'sensing_touchingcolor', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'COLOR', type: 'value', shadow: 'colour_picker'}]},
            {opcode: 'sensing_coloristouchingcolor', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'COLOR', type: 'value', shadow: 'colour_picker'}, {name: 'COLOR2', type: 'value', shadow: 'colour_picker'}]},
            {opcode: 'sensing_distanceto', shape: 'reporter', category: 'sensing',
                inputs: [{name: 'DISTANCETOMENU', type: 'value', shadow: 'sensing_distancetomenu'}]},
            {opcode: 'sensing_askandwait', shape: 'stack', category: 'sensing',
                inputs: [{name: 'QUESTION', type: 'value', shadow: 'text'}]},
            {opcode: 'sensing_answer', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_keypressed', shape: 'boolean', category: 'sensing',
                inputs: [{name: 'KEY_OPTION', type: 'value', shadow: 'sensing_keyoptions'}]},
            {opcode: 'sensing_mousedown', shape: 'boolean', category: 'sensing'},
            {opcode: 'sensing_mousex', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_mousey', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_setdragmode', shape: 'stack', category: 'sensing'},
            {opcode: 'sensing_loudness', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_timer', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_resettimer', shape: 'stack', category: 'sensing'},
            {opcode: 'sensing_of', shape: 'reporter', category: 'sensing',
                inputs: [{name: 'OBJECT', type: 'value', shadow: 'sensing_of_object_menu'}]},
            {opcode: 'sensing_current', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_dayssince2000', shape: 'reporter', category: 'sensing'},
            {opcode: 'sensing_username', shape: 'reporter', category: 'sensing'}
        ],
        operators: [
            {opcode: 'operator_add', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_subtract', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_multiply', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_divide', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_random', shape: 'reporter', category: 'operators',
                inputs: [{name: 'FROM', type: 'value', shadow: 'math_number'}, {name: 'TO', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_gt', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'math_number'}, {name: 'OPERAND2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_lt', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'math_number'}, {name: 'OPERAND2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_equals', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'text'}, {name: 'OPERAND2', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_and', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'boolean'}, {name: 'OPERAND2', type: 'value', shadow: 'boolean'}]},
            {opcode: 'operator_or', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND1', type: 'value', shadow: 'boolean'}, {name: 'OPERAND2', type: 'value', shadow: 'boolean'}]},
            {opcode: 'operator_not', shape: 'boolean', category: 'operators',
                inputs: [{name: 'OPERAND', type: 'value', shadow: 'boolean'}]},
            {opcode: 'operator_join', shape: 'reporter', category: 'operators',
                inputs: [{name: 'STRING1', type: 'value', shadow: 'text'}, {name: 'STRING2', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_letter_of', shape: 'reporter', category: 'operators',
                inputs: [{name: 'LETTER', type: 'value', shadow: 'math_number'}, {name: 'STRING', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_length', shape: 'reporter', category: 'operators',
                inputs: [{name: 'STRING', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_contains', shape: 'boolean', category: 'operators',
                inputs: [{name: 'STRING1', type: 'value', shadow: 'text'}, {name: 'STRING2', type: 'value', shadow: 'text'}]},
            {opcode: 'operator_mod', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM1', type: 'value', shadow: 'math_number'}, {name: 'NUM2', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_round', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM', type: 'value', shadow: 'math_number'}]},
            {opcode: 'operator_mathop', shape: 'reporter', category: 'operators',
                inputs: [{name: 'NUM', type: 'value', shadow: 'math_number'}]}
        ],
        data: [
            {opcode: 'data_setvariableto', shape: 'stack', category: 'data',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'text'}],
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_changevariableby', shape: 'stack', category: 'data',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}],
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_showvariable', shape: 'stack', category: 'data',
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_hidevariable', shape: 'stack', category: 'data',
                fields: [{name: 'VARIABLE', type: 'variable'}]},
            {opcode: 'data_addtolist', shape: 'stack', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_deleteoflist', shape: 'stack', category: 'data',
                inputs: [{name: 'INDEX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'data_deletealloflist', shape: 'stack', category: 'data'},
            {opcode: 'data_insertatlist', shape: 'stack', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}, {name: 'INDEX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'data_replaceitemoflist', shape: 'stack', category: 'data',
                inputs: [{name: 'INDEX', type: 'value', shadow: 'math_number'}, {name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_itemoflist', shape: 'reporter', category: 'data',
                inputs: [{name: 'INDEX', type: 'value', shadow: 'math_number'}]},
            {opcode: 'data_itemnumoflist', shape: 'reporter', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_lengthoflist', shape: 'reporter', category: 'data'},
            {opcode: 'data_listcontainsitem', shape: 'boolean', category: 'data',
                inputs: [{name: 'ITEM', type: 'value', shadow: 'text'}]},
            {opcode: 'data_showlist', shape: 'stack', category: 'data'},
            {opcode: 'data_hidelist', shape: 'stack', category: 'data'}
        ],
        pen: [
            {opcode: 'pen_clear', shape: 'stack', category: 'pen'},
            {opcode: 'pen_stamp', shape: 'stack', category: 'pen'},
            {opcode: 'pen_penDown', shape: 'stack', category: 'pen'},
            {opcode: 'pen_penUp', shape: 'stack', category: 'pen'},
            {opcode: 'pen_setPenColorToColor', shape: 'stack', category: 'pen',
                inputs: [{name: 'COLOR', type: 'value', shadow: 'colour_picker'}]},
            {opcode: 'pen_changePenColorParamBy', shape: 'stack', category: 'pen',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'pen_setPenColorParamTo', shape: 'stack', category: 'pen',
                inputs: [{name: 'VALUE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'pen_changePenSizeBy', shape: 'stack', category: 'pen',
                inputs: [{name: 'SIZE', type: 'value', shadow: 'math_number'}]},
            {opcode: 'pen_setPenSizeTo', shape: 'stack', category: 'pen',
                inputs: [{name: 'SIZE', type: 'value', shadow: 'math_number'}]}
        ],
        music: [
            {opcode: 'music_playDrumForBeats', shape: 'stack', category: 'music',
                inputs: [{name: 'BEATS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_restForBeats', shape: 'stack', category: 'music',
                inputs: [{name: 'BEATS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_playNoteForBeats', shape: 'stack', category: 'music',
                inputs: [{name: 'NOTE', type: 'value', shadow: 'math_number'}, {name: 'BEATS', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_setInstrument', shape: 'stack', category: 'music'},
            {opcode: 'music_setTempo', shape: 'stack', category: 'music',
                inputs: [{name: 'TEMPO', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_changeTempo', shape: 'stack', category: 'music',
                inputs: [{name: 'TEMPO', type: 'value', shadow: 'math_number'}]},
            {opcode: 'music_getTempo', shape: 'reporter', category: 'music'}
        ]
    }
};
