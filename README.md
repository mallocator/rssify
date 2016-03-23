# rssify
[![npm version](https://badge.fury.io/js/rssify.svg)](http://badge.fury.io/js/rssify)
[![Build Status](https://travis-ci.org/mallocator/rssify.svg?branch=master)](https://travis-ci.org/mallocator/rssify)
[![Coverage Status](https://coveralls.io/repos/mallocator/rssify/badge.svg?branch=master&service=github)](https://coveralls.io/github/mallocator/rssify?branch=master)
[![Dependency Status](https://david-dm.org/mallocator/rssify.svg)](https://david-dm.org/mallocator/rssify) 

Turns web pages into rss feeds

## About

After the shutdown of Yahoo pipes and the Kimono Labs I got tired of finding yet another rss scraper online. Instead
I figured I can write a server of my own in a weekend and host it on my own instance.

## Features

This sever is really pretty simple. Grab some elements of a website, compare to what you got before and then server
that content as rss feed:

* Crawl multiple websites in parallel
* Configure using json file
* Use CSS selectors from cheerio/jquery 
* Run additional formatting/javascript to modify the results
* Persist feed data either on the file system or keep it in memory as long as the server runs

## Installation

```npm install rssify```

## Daemonizing

If you want to have the server run as a daemon I recommend using a 3rd party tool such as 
[initid-forever](https://github.com/92bondstreet/initd-forever)

## Running

With node installed just go to the project folder and run ```node .```. If you installed the library globally you should 
have a new executable available called ```rssify```. 

There's only one (optional) argument the script accepts and that is the location of config file. Where ever you decide
to put your config, make sure it ends with .json, otherwise the program will not know how to parse it.

## Configuration

The configuration is stored in a file called config.json in the project directory and consists of 2 basic elements. 
The global element holds certain properties that are used by the environment, which are:

```debug``` Wether you want the server to print a few message or want it to shut up  
```storage``` Right now supports "file" or "meme"  
```path``` Used with file storage, configures the location on disk (default = <rssify-dir>/feeds)  
```port``` The port the server is going to listen on for incoming requests  
```host``` The hostname used when generating the rss feed, that a reader can link back to (defaults to http://localhost:10001)  

Other elements of the global config will be applied to each of the feed configs.

Feed configs are defined by their feed name as property and the configuration object:

```url``` The address where the server should check for updates  
```interval``` The interval in minutes between crawling a web page again  
```cooldown``` How long to wait (in minutes) after a new entry has been found until we look again
```size``` The maximum number of items that are reporting on this feed  
```validate``` An array of field names that will be checked to determine if content has changed/updated
```fields``` An array of field configurations. See below for more info.  

Fields are mapped directly to the rss item properties. The fields are used to define where to grab content from and
potentially transform it:

```field``` Name of the field as it will appear in the rss feed  
```selector``` a cheerio/jquery selector. If multiple elements are selected, they will be concatenated.  
```attr``` The attribute of the selected element to use ("text" and "html" are special values that will return the 
content). This field is only evaluated if a selector has been set.  
```format``` A standard util.format string that gets the content from selected + attribute passed in as string. Will 
only be evaluated if a selector has been set and is applied to each individual element if a selector returns more than
one  
```evaluate``` A javascript string that's passed in to eval(). The concatenated content (if any) is available for
manipulation, but really any javascript can be used to return content.  
```content``` Used to set a static string as content. If any of the other methods produces a string, this value will be
overwritten.  

To see an example just take a look at the [config](./config.json).
 

## Getting Feedly to work

Feedly needs some extra love to understand this feed. To help it along the way you can use 
[feedburner](https://feedburner.google.com/) to host a compatible version. 