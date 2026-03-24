---
layout: distill
title: TMLR Beyond PDF Example Submission
description: This is an example submission for TMLR Beyond PDF.
htmlwidgets: true

# Anonymize when submitting
authors:
  - name: Anonymous
    affiliations:
      name: Anonymous

# Only add author names for camera-ready
# authors:
#   - name: Author Name
#     url: "https://[url_of_author]"
#     affiliations:
#       name: Research Center, University Name
#   - name: Another Author Name
#     url: "https://[url_of_author]"
#     affiliations:
#       name: Research Center, University Name

# Must be the same name as your submission. Do not change this name, just use "submission.bib".
bibliography: submission.bib

# Add a table of contents to your submission.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the submission to work correctly.
toc:
  - name: Interactive Figure 1
  - name: Example GIF
  - name: Interactive Figure 2
  - name: Example Image
  - name: Example Math
  - name: Example Code
  - name: Example Citations
---


## Interactive Figure 1

<figure style="text-align: center; margin: 20px 0;">
    <iframe 
        src="{{ 'assets/html/submission/graph.html' | relative_url }}"
        width="100%" 
        height="500" 
        style="border: none; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        title="Interactive Graph">
    </iframe>
    <figcaption>Interactive force-directed graph.</figcaption>
</figure>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus sit amet ultrices sem. Cras non tellus non velit hendrerit faucibus ac sed tortor. Nulla id diam elementum, volutpat erat eget, imperdiet metus. Nunc et mauris in leo sodales tempus. Aliquam vitae ullamcorper odio. Vestibulum nulla lorem, suscipit vitae turpis a, porttitor ultrices libero. Nam molestie tempus erat, ut ullamcorper neque molestie at. Proin condimentum sapien at lorem posuere ornare.


## Example GIF

{% include figure.html path="assets/gif/submission/Frog.gif" style="max-width:80%;height:auto;" class="img-fluid rounded" %}


## Interactive Figure 2

<blockquote>
  <p>This is an example blockquote.</p>
</blockquote>

Etiam ullamcorper, urna vel euismod varius, enim tortor porttitor est, vel vestibulum neque lorem nec enim. Quisque scelerisque non mauris eu posuere. Quisque aliquam hendrerit lorem, rhoncus tempor arcu hendrerit a. Donec metus augue, tristique at ipsum ullamcorper, accumsan pretium leo. Aenean rutrum gravida justo. Nam vulputate tempor odio, viverra efficitur tellus. In hac habitasse platea dictumst. In enim mauris, porttitor eget dignissim ac, sodales vel nulla. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vulputate finibus dictum.

<figure style="text-align: center;">
    <iframe 
        src="{{ 'assets/html/submission/tangent.html' | relative_url }}"
        width="100%" 
        height="500"
        style="border: none; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
        title="Interactive Tangent Lines">
    </iframe>
    <figcaption>Tangent lines to a curve.</figcaption>
</figure>


## Example Image

{% include figure.html path="assets/img/submission/TMLR_Static_Image.jpg" style="max-width:80%;height:auto;" class="img-fluid rounded" caption="An example static image." %}


## Example Math

Here is an inline equation: $x^2 + y^2 = z^2$. And here is a block equation:

$$
L = \lim_{h \to 0} \frac{f(a + h) - f(a)}{h}
$$


## Example Code

Here is a code block:

{% highlight python %}
def count(n):
  for i in range(n):
    print(i)
{% endhighlight %}



## Example Citations

Example citations: <d-cite key="krizhevsky2012imagenet"></d-cite><d-cite key="sutskever2014sequence"></d-cite>


Sed pellentesque neque tellus, ut euismod turpis suscipit et. Sed ultrices gravida velit, sed mattis enim tincidunt ut. Morbi semper dolor ante, vel pellentesque ligula tempus at. Interdum et malesuada fames ac ante ipsum primis in faucibus. Integer pellentesque velit sed lectus ullamcorper sodales. Donec vitae dolor in lacus sodales feugiat sed et diam. Nullam pellentesque condimentum nunc, ut vulputate velit congue ac. Donec congue ut quam sit amet pellentesque.
