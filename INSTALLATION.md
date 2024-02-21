## URY POS Installation

**Prerequisite Setup:**
- Before using URY POS, ensure you have URY  and Doppio installed in your bench.
- Doppio is used to setup and manage  custom desk pages using Vue 3 on URY POS App and you don't have to install doppio in your site.
- Follow the [URY installation guide](https://github.com/ury-erp/ury/blob/main/INSTALLATION.md) for the installation process.


### To install URY POS , follow these steps:

**Create New site:**

```sh
	$ bench new-site sitename
```

**Install the Doppio app to your bench:**

```sh 
	$ bench get-app https://github.com/NagariaHussain/doppio
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

