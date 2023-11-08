## URY POS Installation

**Prerequisite Setup:**
- Before using URY POS, ensure you have URY installed.
- Follow the [URY installation guide](https://github.com/ury-erp/ury/blob/main/INSTALLATION.md) for the installation process.


### To install URY POS , follow these steps:

**Create New site:**

```sh
	$ bench new-site sitename
```

**Install the URY POS app to your bench:**

```sh
	$ bench get-app ury_pos https://github.com/ury-erp/pos.git
```

**To install URY POS into site:**

```sh
	$ bench --site sitename install-app ury_pos
```

**Migrate the site:**

```sh
	$ bench --site sitename migrate
```

