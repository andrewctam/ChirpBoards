package org.andrewtam.ChirpBoards;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
public class ChirpBoardsApplication {

	
	public static void main(String[] args) {
		SpringApplication.run(ChirpBoardsApplication.class, args);
	}

}
