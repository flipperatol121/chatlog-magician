# Chatlog Magician

A fork of the original Chatlog Magician, rebuilt for GTA World (FiveM). This tool converts GTA World chat logs into formatted images, making screenshot editing easier for roleplay servers.

## About This Fork

This project is a fork of the original Chatlog Magician by ulasbayraktar. It has been adapted to support GTA World's chat format, which differs from the original SA-MP version.

Original repository: https://github.com/ulasbayraktar/chatlog-magician

## Features

- Removes timestamps from chat logs
- Automatically detects chat types and adjusts line colors accordingly:
  - Standard speech (says:)
  - Whisper (whispers:)
  - Low speech ([low])
  - Lower speech ([lower])
  - Shouts (shouts:)
  - Emotes (* action *)
  - Radio communications (** [S: X | CH: X] **)
  - Phone calls (says (phone):)
  - Private messages (PM from/to)
  - And many more GTA World-specific formats
- Character highlighting
- Customizable text colors
- Background color toggle
- Censorship feature (÷ symbol to hide text)
- Export as PNG or copy to clipboard

## Examples
### Emote

```
* Jane Doe looks around nervously, sweating slightly as she waits for her contact to arrive.
* Can you see what's on the back seat of the car? (( Jane Doe ))
```

##### Image

![emote example](https://i.imgur.com/elLhJnP.png)


### Speech:

```
John Smith says: Hello GTA World!
John Smith says [low]: Hello GTA World!
John Smith says [lower]: Hello GTA World!
John Smith shouts: Hello GTA World!
```

##### Image

![speech example](https://i.imgur.com/pxiw5D7.png)


### Radio:

```
** [S: 1 | CH: 6125] John Smith says: Test.
** [S: 1 | CH: 6125] * Jane Doe taps the radio.
```

##### Image

![radio example](https://i.imgur.com/lE8D52u.png)


### Phone:

```
John Smith says (phone): Hi!
(iFruit 15 Pro) Incoming call from Jane. Use (/p)ickup to answer.
Your call has been picked up.
You have hung up the call.
```

##### Image

![phone example](https://i.imgur.com/MqlfI7e.png)


### Whisper:

```
Jane Doe whispers: I'll be honest with you, right.
```

##### Image

![whisper example](https://i.imgur.com/mahfvrg.png)


### PM (Private Messages):

```
(( PM from (123) John Smith: hey, how are you? ))
(( PM to (123) John Smith: i'm good, thanks! ))
```

##### Image

![pm example](https://i.imgur.com/YCXuW6V.png)


### Item Display:

```
Item T-Shirt is no longer displayed.
Item T-Shirt is now displayed.
```

##### Image

![item example](https://i.imgur.com/VHAwDZN.png)

## Usage

1. Copy your chat log from GTA World
2. Paste it into the text area
3. Adjust font size and wrap width as needed
4. Add character names to highlight their speech
5. Use the ÷ button to copy the censorship symbol
6. Click "Copy" or "Download" to save the formatted image

## Credits

- Original creator: ulasbayraktar (https://github.com/ulasbayraktar)
- Original tool name: KUnderwood (https://github.com/danjdewhurst)

## Acknowledgments

Special thanks to the original developers and contributors of the Chatlog Magician project. This fork would not exist without their foundational work.