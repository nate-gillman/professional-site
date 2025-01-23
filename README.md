# professional-site

This is the repo for my professional website. 

<!-- Notes to self: Currently this repo is hosted on Github via Google sites... the notes below were accurate when this was hosted as a static HTML page on Brown's site. -->

<!-- Notes to self: Currently this repo is hosted on as a static HTML page on Brown's site. -->


1. Currently, this repo is hosted at [https://cs.brown.edu/people/ngillman/](https://cs.brown.edu/people/ngillman/). These files are stored under Brown's file system, which I can access via ```ssh ngillman@ssh.cs.brown.edu``` and ```cd /web/cs/web/people/ngillman```. 
2. Once in this folder, I should execute ```rm -rf *``` to delete all contents (this will leave behind some annoying files... must remove those as well!!), then ```git clone https://github.com/nate-gillman/professional-site.git .``` to copy the new files from the repo. 
3. To get the file permissions correct on Brown's file system, execute ```chmod -R ugo+rX .```
4. In order to switch it back so that the repo is hosted on github through nategillman.com, I need to use the DNS settings that I screenshotted and put under the /images folder, and also put nategillman.com inside a CNAME document in the repo. OTOH, in order to switch it so it's hosted by Brown, I just need to upload the html/css files to the static HTML server (as described above) and, in google domains, use "domain forwarding" to point to that address.
5. If for some reason Brown CS's file system won't let me ssh in, I problably need to redo the ssh keypair authentication setup [http://cs.brown.edu/about/system/connecting/ssh/osx/](http://cs.brown.edu/about/system/connecting/ssh/osx/)

Attribution (and thanks) are due to Srinath Sridhar, who kindly let me cannibalize his website ([https://github.com/drsrinathsridhar/homepage](https://github.com/drsrinathsridhar/homepage))

6. NOTE: when developing locally, `npx serve`
