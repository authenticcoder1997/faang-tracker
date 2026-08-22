import urllib.request
import json
import re

dsa = []
with open('src/data/dsaTopics.js', 'r') as f:
    content = f.read()
    # Very hacky parse
    content = content[content.find('['):content.rfind(']')+1]
    # Make it valid JSON by ensuring keys are quoted if needed, but it's JS so it's a bit tricky.
    # Actually, let's just write a JS script instead to read it
