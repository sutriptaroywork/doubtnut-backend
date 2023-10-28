<?php

 $cdir = scandir("./images/"); 
   foreach ($cdir as $key => $value) 
   { 
   		if($value != "." && $value != ".."){
   			echo $value;
   			$value = "images/".$value;
   			$webp = str_replace(".png", ".webp", $value);
   			exec("convert ". $value. " ". $webp);
   		}
   }

?>