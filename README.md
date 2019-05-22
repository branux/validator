# ![alt text][logo] Gunbot.Tools

## About The Tool

[Gunbot.Tools](https://dev.gunbot.tools/) provides an open source tool to validate Gunbot configuration files against known Gunbot versions.
All Gunbot configuration data has been collated from the official [Gunbot wiki](https://wiki.gunthy.org/) - though some of the data has been reformatted, as the wiki is not *always* correct.

Gunbot.Tools validates input configuration files using a set of generated JSON template files, which list all possible fields, strategies, exchanges, links and values for the applicable version.
The validator then uses this pre-generated JSON template to validate the supplied configuration file - and flag any fields/sections which aren't expected.

Gunbot.Tools currently detects errors of the following nature:
  
  * Invalid JSON
  * Invalid Fields
  * Missing Fields
  * Invalid Field Values
  * Invalid Sections
  * Missing Sections
  * Invalid Strategy Types
  * Invalid Strategies Assigned To Pairs
  * Invalid Exchanges

All the *validation* of configuration files **happens within the browser**. 
Logic for the frontend validator is located under `controllers/ctrl.index.js`.

Gunbot.Tools can open Gunbot configuration files from the local file system. 
This **does not** upload the file to our server, it simply reads the contents from the file into the browser, where the validation is performed.

## Repairing, Upgrading & Downgrading

[Gunbot.Tools](https://dev.gunbot.tools/) also provides a *private* tool, which allows for the automatic repair, upgrading & downgrading of Gunbot configuration files.
Once a configuration file has been validated using the tool, an option to fix the selected config will appear. This will repair any issues - and convert it to the version selected in the tool.

Repairing, upgrading & downgrading **does** occur on the Gunbot.Tools servers, using a private API.
Before the configuration file is transmitted to the API, all sensitive information is stripped and stored within the browser to ensure complete privacy.

The following information is stripped and stored before transmission:

  * Exchange Keys & Secrets
  * Telegram Tokens & Passwords
  * Tradingview Emails, Usernames & Passwords
  * Wallet Addresses
  
Once the new configuration file has been returned from the API, the tool will then re-populate all stored protected fields.

## Contributions

If you're interested in helping with the development of Gunbot.Tools, please contact [Glenndilen](https://t.me/Glenndilen) via Telegram.
For issues and requests, please use the GitHub issue tracker [here](https://github.com/gunbot-tools/validator/issues).

Donations towards Gunbot.Tools are always welcome and appreciated. 
If you'd like to contribute, please use our BTC address:

**3A3MHPnHW1A98wBbdNC2JZ19MrVa4dmPdU**